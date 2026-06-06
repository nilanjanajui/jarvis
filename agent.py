from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess, platform

app = Flask(__name__)
CORS(app)
OS  = platform.system()

APPS = {
    'Windows': {
        'spotify':    'start spotify:',
        'vscode':     'code',
        'vs code':    'code',
        'chrome':     'start chrome',
        'firefox':    'start firefox',
        'notepad':    'notepad',
        'calculator': 'calc',
        'explorer':   'explorer',
        'discord':    'start discord:',
        'telegram':   'start telegram:',
        'whatsapp':   'start whatsapp:',
        'vlc':        'start vlc',
        'terminal':   'start cmd',
        'task manager': 'taskmgr',
    },
    'Darwin': {
        'spotify':    'open -a Spotify',
        'vscode':     'open -a "Visual Studio Code"',
        'chrome':     'open -a "Google Chrome"',
        'firefox':    'open -a Firefox',
        'calculator': 'open -a Calculator',
        'terminal':   'open -a Terminal',
        'discord':    'open -a Discord',
        'vlc':        'open -a VLC',
    },
    'Linux': {
        'spotify':    'spotify',
        'vscode':     'code',
        'chrome':     'google-chrome',
        'firefox':    'firefox',
        'calculator': 'gnome-calculator',
        'terminal':   'gnome-terminal',
        'discord':    'discord',
    },
}

def find_cmd(name):
    name  = name.lower().strip()
    table = APPS.get(OS, APPS['Linux'])
    if name in table:
        return table[name]
    for key, cmd in table.items():
        if key in name or name in key:
            return cmd
    return None

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'os': OS})

@app.route('/execute', methods=['POST'])
def execute():
    app_name = (request.json or {}).get('app', '')
    cmd = find_cmd(app_name)
    if not cmd:
        return jsonify({'success': False, 'message': f"Don't know how to open '{app_name}'"}), 404
    try:
        subprocess.Popen(cmd, shell=True)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/volume', methods=['POST'])
def volume():
    action = (request.json or {}).get('action', '')
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
        'Linux': {
            'up':   'amixer -D pulse sset Master 10%+',
            'down': 'amixer -D pulse sset Master 10%-',
            'mute': 'amixer -D pulse sset Master toggle',
        },
    }
    cmd = cmds.get(OS, {}).get(action)
    if not cmd:
        return jsonify({'success': False}), 400
    subprocess.Popen(cmd, shell=True)
    return jsonify({'success': True})

if __name__ == '__main__':
    print(f'\nJARVIS Agent — OS: {OS}')
    print('Running at http://localhost:5001\n')
    app.run(port=5001, debug=False)