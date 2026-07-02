from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import platform
import os
import shutil

app = Flask(__name__)

# No trailing slash on the Vercel URL
CORS(app, origins=[
    "http://localhost:3000",
    "https://jarvis-theta-indol.vercel.app",
])

OS = platform.system()

# Capture the FULL user environment at startup — includes PATH, DISPLAY, DBUS, etc.
# This is the critical fix: subprocess inherits this, so it can find all your apps
ENV = os.environ.copy()

# GUI apps need DISPLAY to know which screen to open on
if OS == 'Linux' and 'DISPLAY' not in ENV:
    ENV['DISPLAY'] = ':0'

# Also needed for some apps on Linux
if OS == 'Linux' and 'DBUS_SESSION_BUS_ADDRESS' not in ENV:
    ENV['DBUS_SESSION_BUS_ADDRESS'] = f'unix:path=/run/user/{os.getuid()}/bus'

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

# Build the app table once at startup
LINUX_APPS = build_linux_apps() if OS == 'Linux' else {}

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

    # Partial match
    for key, cmd in table.items():
        if key in name or name in key:
            return cmd

    # Last resort — maybe the app name itself is a valid command
    if OS == 'Linux' and installed(name):
        return name

    return None


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
    app_name = (request.json or {}).get('app', '').strip()

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
        subprocess.Popen(
    cmd,
    shell=True,
    env=ENV,
    stdout=subprocess.DEVNULL,
    stderr=None,  # ← let it print to Flask's terminal so you can see the error
    start_new_session=True,  # ← decouple from Flask's process group
)
        print(f'[execute] Opened: {app_name} → {cmd}')
        return jsonify({'success': True, 'command': cmd})
    except Exception as e:
        print(f'[execute] Error: {e}')
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/volume', methods=['POST'])
def volume():
    action = (request.json or {}).get('action', '').lower()

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

    cmd = cmds.get(OS, {}).get(action)
    if not cmd:
        return jsonify({'success': False, 'message': f'Unknown action: {action}'}), 400

    try:
        subprocess.Popen(cmd, shell=True, env=ENV,
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


if __name__ == '__main__':
    print(f'\nJARVIS Agent')
    print(f'OS       : {OS}')
    print(f'DISPLAY  : {ENV.get("DISPLAY", "NOT SET — GUI apps may not open")}')
    print(f'Apps found on this system:')
    for k, v in APPS.get(OS, {}).items():
        print(f'  {k:<22} → {v}')
    print(f'\nRunning at http://localhost:5001\n')
    app.run(port=5001, debug=False)