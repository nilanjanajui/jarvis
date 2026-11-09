from flask import Flask, request, jsonify
from flask_cors import CORS
from urllib.parse import urlparse
import subprocess
import platform
import os
import re
import shlex
import shutil
import psutil
import time
import webbrowser
import threading
import asyncio
import json

app = Flask(__name__)

# FIX: reject oversized request bodies
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024

# No trailing slash on the Vercel URL
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://jarvis-theta-indol.vercel.app",
]
# Optional: extra origins, e.g. JARVIS_EXTRA_ORIGINS="http://localhost:3001,http://127.0.0.1:3000"
ALLOWED_ORIGINS += [o.strip() for o in os.environ.get('JARVIS_EXTRA_ORIGINS', '').split(',') if o.strip()]

# FIX: Host allowlist blocks DNS-rebinding attacks against the local agent
ALLOWED_HOSTS = {'localhost:5001', '127.0.0.1:5001'}

CORS(app, origins=ALLOWED_ORIGINS)


@app.before_request
def guard():
    """
    FIX: CORS only controls whether a browser may READ a response. It does not stop a request
    from being sent. Reject bad Host / Origin before any route runs.
    Requests with no Origin header (curl, scripts) are allowed.
    """
    host = (request.host or '').lower()
    if host not in ALLOWED_HOSTS:
        return jsonify({'success': False, 'message': 'Host not allowed'}), 403
    origin = request.headers.get('Origin')
    if origin is not None and origin not in ALLOWED_ORIGINS:
        return jsonify({'success': False, 'message': 'Origin not allowed'}), 403


OS = platform.system()
START_TIME = time.time()

# Capture the FULL user environment at startup — includes PATH, DISPLAY, DBUS, etc.
# This is the critical fix: subprocess inherits this, so it can find all your apps
ENV = os.environ.copy()

# GUI apps need DISPLAY to know which screen to open on
if OS == 'Linux' and 'DISPLAY' not in ENV:
    ENV['DISPLAY'] = ':0'

# Also needed for some apps on Linux
if OS == 'Linux' and 'DBUS_SESSION_BUS_ADDRESS' not in ENV:
    ENV['DBUS_SESSION_BUS_ADDRESS'] = f'unix:path=/run/user/{os.getuid()}/bus'


# ── Request helpers ───────────────────────────────────────────────────────────

def body():
    """FIX: always a dict, even for missing / non-JSON / non-object bodies."""
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def text(data, key, maxlen=500):
    """FIX: always a stripped, length-capped string (original crashed on non-string values)."""
    v = data.get(key, '')
    return v.strip()[:maxlen] if isinstance(v, str) else ''


# ── App discovery ─────────────────────────────────────────────────────────────

def installed(cmd):
    """Check if a command exists anywhere in the user's PATH."""
    return shutil.which(cmd, path=ENV.get('PATH', os.defpath)) is not None

def snap(name):
    """Check if a snap package is installed."""
    return os.path.exists(f'/snap/bin/{name}')

def build_linux_apps():
    """
    Dynamically detect what's installed on this specific Ubuntu system.
    Checks PATH and /snap/bin — no hardcoded assumptions.
    """
    apps = {}

    # VS Code
    if installed('code'):
        apps.update({'vscode': 'code', 'vs code': 'code', 'visual studio code': 'code'})
    elif snap('code'):
        apps.update({'vscode': '/snap/bin/code', 'vs code': '/snap/bin/code'})

    # Chrome
    for name in ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']:
        if installed(name):
            apps.update({'chrome': name, 'google chrome': name})
            break
    if 'chrome' not in apps and snap('chromium'):
        apps.update({'chrome': '/snap/bin/chromium', 'google chrome': '/snap/bin/chromium'})

    # Firefox
    if installed('firefox'):
        apps['firefox'] = 'firefox'
    elif snap('firefox'):
        apps['firefox'] = '/snap/bin/firefox'

    # Terminal
    for term in ['gnome-terminal', 'kgx', 'xfce4-terminal', 'konsole', 'xterm']:
        if installed(term):
            apps['terminal'] = term
            break

    # Spotify
    if installed('spotify'):
        apps['spotify'] = 'spotify'
    elif snap('spotify'):
        apps['spotify'] = '/snap/bin/spotify'

    # VLC
    if installed('vlc'):
        apps['vlc'] = 'vlc'
    elif snap('vlc'):
        apps['vlc'] = '/snap/bin/vlc'

    # Calculator
    for calc in ['gnome-calculator', 'kcalc', 'galculator', 'qalculate-gtk']:
        if installed(calc):
            apps['calculator'] = calc
            break

    # File manager
    for fm in ['nautilus', 'nemo', 'thunar', 'dolphin']:
        if installed(fm):
            apps.update({'files': fm, 'file manager': fm, 'explorer': fm})
            break

    # Text editor
    for ed in ['gedit', 'geany', 'kate', 'mousepad', 'xed']:
        if installed(ed):
            apps.update({'notepad': ed, 'text editor': ed, 'editor': ed})
            break

    # Discord
    if installed('discord'):
        apps['discord'] = 'discord'
    elif snap('discord'):
        apps['discord'] = '/snap/bin/discord'

    # Telegram
    if installed('telegram-desktop'):
        apps['telegram'] = 'telegram-desktop'
    elif snap('telegram-desktop'):
        apps['telegram'] = '/snap/bin/telegram-desktop'

    # Postman
    if snap('postman'):
        apps['postman'] = '/snap/bin/postman'

    # Slack
    if snap('slack'):
        apps['slack'] = '/snap/bin/slack'
    elif installed('slack'):
        apps['slack'] = 'slack'

    return apps

# FIX: the "last resort" launcher used to run ANY command found on PATH. Now it only launches
# binaries that a .desktop (GUI app) entry points to, with a plain-name check and a small
# interpreter/shell exclusion list.
SAFE_NAME = re.compile(r'^[a-z0-9][a-z0-9._+-]{0,63}$')
NEVER_LAUNCH = {'sh', 'bash', 'zsh', 'dash', 'fish', 'env', 'python', 'python3', 'perl', 'ruby', 'node', 'sudo'}

def desktop_binaries():
    names = set()
    dirs = [
        '/usr/share/applications',
        '/usr/local/share/applications',
        '/var/lib/snapd/desktop/applications',
        os.path.expanduser('~/.local/share/applications'),
    ]
    for d in dirs:
        try:
            files = os.listdir(d)
        except OSError:
            continue
        for f in files:
            if not f.endswith('.desktop'):
                continue
            try:
                with open(os.path.join(d, f), errors='ignore') as fh:
                    for line in fh:
                        if line.startswith('Exec='):
                            parts = shlex.split(line[5:].strip())
                            if parts:
                                names.add(os.path.basename(parts[0]))
                            break
            except (OSError, ValueError):
                pass
    return names

# Build the app table once at startup
LINUX_APPS = build_linux_apps() if OS == 'Linux' else {}
DESKTOP_BINS = desktop_binaries() if OS == 'Linux' else set()

APPS = {
    'Windows': {
        'spotify':      'start spotify:',
        'vscode':       'code',
        'vs code':      'code',
        'chrome':       'start chrome',
        'firefox':      'start firefox',
        'notepad':      'notepad',
        'calculator':   'calc',
        'explorer':     'explorer',
        'discord':      'start discord:',
        'telegram':     'start telegram:',
        'whatsapp':     'start whatsapp:',
        'vlc':          'start vlc',
        'terminal':     'start cmd',
        'task manager': 'taskmgr',
    },
    'Darwin': {
        'spotify':    'open -a Spotify',
        'vscode':     'open -a "Visual Studio Code"',
        'vs code':    'open -a "Visual Studio Code"',
        'chrome':     'open -a "Google Chrome"',
        'firefox':    'open -a Firefox',
        'calculator': 'open -a Calculator',
        'terminal':   'open -a Terminal',
        'discord':    'open -a Discord',
        'vlc':        'open -a VLC',
    },
    'Linux': LINUX_APPS,
}

def find_cmd(name):
    name  = name.lower().strip()
    table = APPS.get(OS, {})

    # Exact match
    if name in table:
        return table[name]

    # FIX: partial match needs 3+ chars (a 1-2 letter name used to match the first table entry)
    if len(name) >= 3:
        for key, cmd in table.items():
            if key in name or name in key:
                return cmd

    # Last resort — only GUI apps (have a .desktop entry), plain names only
    if (OS == 'Linux' and SAFE_NAME.match(name) and name not in NEVER_LAUNCH
            and name in DESKTOP_BINS and installed(name)):
        return name

    return None

def launch(cmd):
    """
    FIX: no shell on Linux/macOS (the table values are plain commands). Windows needs the shell
    for `start ...`; those values are all hardcoded in APPS.
    stdin is closed so a launched program can never read from the agent's terminal.
    """
    kwargs = dict(
        env=ENV,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=None,              # let it print to Flask's terminal so you can see the error
        start_new_session=True,   # decouple from Flask's process group
    )
    if OS == 'Windows':
        subprocess.Popen(cmd, shell=True, **kwargs)
    else:
        subprocess.Popen(shlex.split(cmd), **kwargs)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':     'ok',
        'os':         OS,
        'display':    ENV.get('DISPLAY', 'not set'),
        'known_apps': list(APPS.get(OS, {}).keys()),
    })

@app.route('/execute', methods=['POST'])
def execute():
    app_name = text(body(), 'app', 100)

    if not app_name:
        return jsonify({'success': False, 'message': 'No app name provided'}), 400

    cmd = find_cmd(app_name)

    if not cmd:
        return jsonify({
            'success':    False,
            'message':    f"Don't know how to open '{app_name}' on {OS}",
            'known_apps': list(APPS.get(OS, {}).keys()),
        }), 404

    try:
        launch(cmd)
        print(f'[execute] Opened: {app_name} → {cmd}')
        return jsonify({'success': True, 'command': cmd})
    except FileNotFoundError:
        return jsonify({'success': False, 'message': f"'{cmd}' not found on this system"}), 404
    except Exception as e:
        print(f'[execute] Error: {e}')
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/open-url', methods=['POST'])
def open_url():
    url = text(body(), 'url', 2000)
    if not url:
        return jsonify({'success': False, 'message': 'No URL provided'}), 400

    # FIX: only http(s). xdg-open will happily open file:// and custom protocol handlers.
    parsed = urlparse(url)
    if parsed.scheme not in ('http', 'https') or not parsed.netloc:
        return jsonify({'success': False, 'message': 'Only http(s) URLs are allowed'}), 400

    try:
        if OS == 'Linux':
            subprocess.Popen(['xdg-open', url], env=ENV, stdin=subprocess.DEVNULL,
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            webbrowser.open(url)
        print(f'[open-url] Opened: {url}')
        return jsonify({'success': True, 'url': url})
    except Exception as e:
        print(f'[open-url] Error: {e}')
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/volume', methods=['POST'])
def volume():
    action = text(body(), 'action', 20).lower()

    cmds = {
        'Windows': {
            'up':   'powershell -c "(New-Object -comObject WScript.Shell).SendKeys([char]175)"',
            'down': 'powershell -c "(New-Object -comObject WScript.Shell).SendKeys([char]174)"',
            'mute': 'powershell -c "(New-Object -comObject WScript.Shell).SendKeys([char]173)"',
        },
        'Darwin': {
            'up':   'osascript -e "set volume output volume (output volume of (get volume settings) + 10)"',
            'down': 'osascript -e "set volume output volume (output volume of (get volume settings) - 10)"',
            'mute': 'osascript -e "set volume with output muted"',
        },
        # pactl works for both PipeWire and PulseAudio on Ubuntu 24
        'Linux': {
            'up':   'pactl set-sink-volume @DEFAULT_SINK@ +10%',
            'down': 'pactl set-sink-volume @DEFAULT_SINK@ -10%',
            'mute': 'pactl set-sink-mute @DEFAULT_SINK@ toggle',
        },
    }

    # Safe to use shell=True here: `cmd` is always one of the hardcoded strings above
    cmd = cmds.get(OS, {}).get(action)
    if not cmd:
        return jsonify({'success': False, 'message': f'Unknown action: {action}'}), 400

    try:
        subprocess.Popen(cmd, shell=True, env=ENV,
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/system-stats', methods=['GET'])
def system_stats():
    try:
        cpu_percent = psutil.cpu_percent(interval=0.3)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        uptime_seconds = int(time.time() - START_TIME)
        hours = uptime_seconds // 3600
        minutes = (uptime_seconds % 3600) // 60

        # Temperature isn't available on all systems — fail gracefully
        temp_c = None
        try:
            temps = psutil.sensors_temperatures()
            if temps:
                first_sensor = next(iter(temps.values()))
                if first_sensor:
                    temp_c = round(first_sensor[0].current, 1)
        except Exception:
            pass

        return jsonify({
            'cpu_percent': round(cpu_percent, 1),
            'ram_percent': round(mem.percent, 1),
            'ram_used_gb': round(mem.used / (1024 ** 3), 1),
            'ram_total_gb': round(mem.total / (1024 ** 3), 1),
            'disk_percent': round(disk.percent, 1),
            'temp_c': temp_c,
            'uptime': f'{hours}h {minutes}m',
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/active-window', methods=['GET'])
def active_window():
    title = "Desktop / Environment"
    try:
        if OS == 'Linux':
            res = subprocess.run(['xdotool', 'getactivewindow', 'getwindowname'], capture_output=True, text=True, env=ENV, timeout=1)
            if res.returncode == 0 and res.stdout.strip():
                title = res.stdout.strip()
            else:
                res2 = subprocess.run('xprop -id $(xprop -root _NET_ACTIVE_WINDOW | cut -d " " -f 5) WM_NAME', shell=True, capture_output=True, text=True, env=ENV, timeout=1)
                if res2.returncode == 0 and '"' in res2.stdout:
                    title = res2.stdout.split('"')[1]
        elif OS == 'Darwin':
            cmd = 'osascript -e "tell application \\"System Events\\" to get name of first process whose frontmost is true"'
            res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=1)
            if res.returncode == 0 and res.stdout.strip():
                title = res.stdout.strip()
        elif OS == 'Windows':
            cmd = 'powershell -c "(Get-Process | Where-Object {$_.MainWindowHandle -ne 0} | Sort-Object LastWorkingSet -Descending | Select-Object -First 1).MainWindowTitle"'
            res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=1)
            if res.returncode == 0 and res.stdout.strip():
                title = res.stdout.strip()
    except Exception:
        pass
    return jsonify({'title': title})


@app.route('/media', methods=['POST'])
def media_control():
    action = text(body(), 'action', 20).lower()
    cmds = {
        'Linux': {
            'play_pause': 'playerctl play-pause || xdotool key XF86AudioPlay',
            'next': 'playerctl next || xdotool key XF86AudioNext',
            'previous': 'playerctl previous || xdotool key XF86AudioPrev',
            'stop': 'playerctl stop || xdotool key XF86AudioStop',
        },
        'Darwin': {
            'play_pause': 'osascript -e "tell application \\"Spotify\\" to playpause"',
            'next': 'osascript -e "tell application \\"Spotify\\" to next track"',
            'previous': 'osascript -e "tell application \\"Spotify\\" to previous track"',
        },
        'Windows': {
            'play_pause': 'powershell -c "(New-Object -comObject WScript.Shell).SendKeys([char]179)"',
            'next': 'powershell -c "(New-Object -comObject WScript.Shell).SendKeys([char]176)"',
            'previous': 'powershell -c "(New-Object -comObject WScript.Shell).SendKeys([char]177)"',
        }
    }
    # Safe to use shell=True here: `cmd` is always one of the hardcoded strings above (needs `||`)
    cmd = cmds.get(OS, {}).get(action)
    if not cmd:
        return jsonify({'success': False, 'message': f'Unsupported action: {action}'}), 400
    try:
        subprocess.Popen(cmd, shell=True, env=ENV, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return jsonify({'success': True, 'action': action})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/processes', methods=['GET'])
def get_processes():
    try:
        # FIX: clamp limit; a non-numeric value used to raise and return 500
        try:
            limit = max(1, min(int(request.args.get('limit', 10)), 50))
        except ValueError:
            limit = 10
        procs = []
        for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                info = p.info
                if info['name']:
                    procs.append({
                        'pid': info['pid'],
                        'name': info['name'],
                        'cpu': round(info['cpu_percent'] or 0, 1),
                        'mem': round(info['memory_percent'] or 0, 1),
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        procs.sort(key=lambda x: (x['cpu'], x['mem']), reverse=True)
        return jsonify({'success': True, 'processes': procs[:limit]})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/kill-process', methods=['POST'])
def kill_process():
    try:
        raw_pid = body().get('pid')
        if raw_pid is None or isinstance(raw_pid, bool):
            return jsonify({'success': False, 'message': 'No PID provided'}), 400
        try:
            pid = int(raw_pid)
        except (TypeError, ValueError):
            return jsonify({'success': False, 'message': 'Invalid PID'}), 400

        # FIX: also reject negative PIDs and the agent's parent process (usually your terminal)
        if pid <= 1 or pid in (os.getpid(), os.getppid()):
            return jsonify({'success': False, 'message': 'Protected system process'}), 403

        proc = psutil.Process(pid)
        proc.terminate()
        return jsonify({'success': True, 'message': f'Terminated process PID {pid}'})
    except psutil.NoSuchProcess:
        return jsonify({'success': False, 'message': 'Process not found'}), 404
    except psutil.AccessDenied:
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ── /shell: allowlist, no shell ───────────────────────────────────────────────
# FIX: the old substring blocklist ("rm -rf /", "mkfs", ...) was trivially bypassed
# (`rm -fr ~`, `curl x | sh`, ...). Commands now run WITHOUT a shell, only if allowlisted.
# That means pipes, &&, redirects and globbing no longer work here.
SAFE_CMDS = {'ls', 'pwd', 'uptime', 'df', 'free', 'whoami', 'uname'}
GIT_SUBS = {'status', 'log', 'branch'}
GIT_ARGS = {'--oneline', '-s', '--short', '-5', '-10', '-n'}
MAX_OUTPUT = 20000

def parse_safe(command):
    try:
        argv = shlex.split(command)
    except ValueError:
        return None
    if not argv:
        return None
    if argv[0] in SAFE_CMDS:
        return argv
    if (argv[0] == 'git' and len(argv) > 1 and argv[1] in GIT_SUBS
            and all(a in GIT_ARGS for a in argv[2:])):
        return argv
    return None

@app.route('/shell', methods=['POST'])
def run_shell():
    command = text(body(), 'command', 300)
    if not command:
        return jsonify({'success': False, 'message': 'No command provided'}), 400

    argv = parse_safe(command)
    if not argv:
        return jsonify({'success': False, 'message': 'Command not in allowlist'}), 403

    try:
        res = subprocess.run(argv, capture_output=True, text=True, env=ENV,
                             stdin=subprocess.DEVNULL, timeout=10)
        output = res.stdout if res.returncode == 0 else res.stderr
        return jsonify({
            'success': res.returncode == 0,
            'exit_code': res.returncode,
            'output': (output.strip() or '(no output)')[:MAX_OUTPUT],
        })
    except FileNotFoundError:
        return jsonify({'success': False, 'message': f'{argv[0]} is not installed'}), 404
    except subprocess.TimeoutExpired:
        return jsonify({'success': False, 'message': 'Command timed out after 10 seconds'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ── WebSocket Telemetry & IPC Server ─────────────────────────────────────────

def get_top_processes_list(limit=6):
    procs = []
    for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            info = p.info
            if info['name']:
                procs.append({
                    'pid': info['pid'],
                    'name': info['name'],
                    'cpu': round(info['cpu_percent'] or 0, 1),
                    'mem': round(info['memory_percent'] or 0, 1),
                })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    procs.sort(key=lambda x: (x['cpu'], x['mem']), reverse=True)
    return procs[:limit]

def build_telemetry():
    cpu_percent = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    uptime_seconds = int(time.time() - START_TIME)
    hours = uptime_seconds // 3600
    minutes = (uptime_seconds % 3600) // 60
    return {
        'type': 'telemetry',
        'timestamp': int(time.time() * 1000),
        'data': {
            'cpu_percent': round(cpu_percent, 1),
            'ram_percent': round(mem.percent, 1),
            'ram_used_gb': round(mem.used / (1024 ** 3), 1),
            'ram_total_gb': round(mem.total / (1024 ** 3), 1),
            'disk_percent': round(disk.percent, 1),
            'uptime': f'{hours}h {minutes}m',
            'top_processes': get_top_processes_list(6),
        }
    }

# FIX: cap simultaneous WebSocket clients
MAX_WS_CLIENTS = 4
WS_CLIENTS = 0

async def ws_handler(websocket):
    global WS_CLIENTS
    if WS_CLIENTS >= MAX_WS_CLIENTS:
        await websocket.close(code=1013, reason='Too many clients')
        return
    WS_CLIENTS += 1
    print("[WebSocket] Client connected")
    try:
        while True:
            # FIX: psutil's process scan is blocking; run it off the event loop
            payload = await asyncio.to_thread(build_telemetry)
            await websocket.send(json.dumps(payload))
            await asyncio.sleep(1.0)
    except Exception as e:
        print(f"[WebSocket] Client disconnected: {e}")
    finally:
        WS_CLIENTS -= 1

def start_websocket_server():
    try:
        import websockets
        async def main():
            # FIX: bind loopback only (was 0.0.0.0, reachable from the whole LAN) and check Origin.
            # Browsers always send Origin on WebSocket handshakes, so a page on any other site
            # is refused with HTTP 403. Non-browser clients (no Origin) are refused too.
            async with websockets.serve(ws_handler, "127.0.0.1", 5002, origins=ALLOWED_ORIGINS):
                print("[WebSocket IPC] Server listening on ws://127.0.0.1:5002")
                await asyncio.Future()  # run forever

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(main())
    except Exception as e:
        print(f"[WebSocket IPC] Server NOT running (needs websockets>=10): {e}")

# Launch WebSocket thread
ws_thread = threading.Thread(target=start_websocket_server, daemon=True)
ws_thread.start()


if __name__ == '__main__':
    print(f'\nJARVIS Agent')
    print(f'OS       : {OS}')
    print(f'DISPLAY  : {ENV.get("DISPLAY", "NOT SET — GUI apps may not open")}')
    print(f'Allowed origins: {", ".join(ALLOWED_ORIGINS)}')
    print(f'Apps found on this system:')
    for k, v in APPS.get(OS, {}).items():
        print(f'  {k:<22} → {v}')
    print(f'\nREST API: http://127.0.0.1:5001')
    print(f'WebSocket: ws://127.0.0.1:5002\n')
    # FIX: explicit loopback bind
    app.run(host='127.0.0.1', port=5001, debug=False)