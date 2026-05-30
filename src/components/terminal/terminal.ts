import { siteFiles, type SiteFile } from '../../config';

export class Terminal {
	private container: HTMLElement;
	private input!: HTMLInputElement;
	private output!: HTMLElement;
	private promptEl!: HTMLElement;
	private history: string[] = [];
	private historyIndex: number = -1;

	/** filename -> SiteFile (e.g. "about.md" -> {...}) */
	private readonly filesByName: Map<string, SiteFile>;
	/** id -> SiteFile (e.g. "about" -> {...}) */
	private readonly filesById: Map<string, SiteFile>;

	constructor(container: HTMLElement) {
		this.container = container;
		this.filesByName = new Map(siteFiles.map((f) => [f.filename.toLowerCase(), f]));
		this.filesById = new Map(siteFiles.map((f) => [f.id.toLowerCase(), f]));
		this.init();
	}

	private init() {
		this.container.innerHTML = `
			<div class="terminal-output" id="terminal-output"></div>
			<div class="terminal-input-line">
				<span class="terminal-prompt" id="terminal-prompt"></span>
				<input 
					type="text" 
					class="terminal-input" 
					id="terminal-input"
					autocomplete="off"
					spellcheck="false"
				/>
			</div>
		`;

		this.output = this.container.querySelector('#terminal-output') as HTMLElement;
		this.input = this.container.querySelector('#terminal-input') as HTMLInputElement;
		this.promptEl = this.container.querySelector('#terminal-prompt') as HTMLElement;

		this.refreshPrompt();
		this.addOutput('--------------------------------------');
		this.addOutput('Welcome to my website!');
		this.addOutput('Type "help" to see available commands.');
		this.addOutput('--------------------------------------');

		this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
		this.input.addEventListener('input', () => this.handleInput());
		this.input.focus();

		this.container.addEventListener('click', () => {
			this.input.focus();
		});
	}

	/**
	 * Determine the current page from `window.location.pathname` and map it to a
	 * configured SiteFile id. Falls back to the first configured file.
	 */
	private getCurrentFileId(): string {
		const path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
		const match = siteFiles.find((f) => {
			if (!f.url) return false;
			const u = f.url.replace(/\/+$/, '') || '/';
			return u === path;
		});
		return match?.id ?? siteFiles[0].id;
	}

	private renderPrompt(): string {
		const id = this.getCurrentFileId();
		const location = id === 'home' ? '~' : `~/${id}`;
		return `visitor@marlonii ${location} %`;
	}

	private refreshPrompt() {
		this.promptEl.textContent = this.renderPrompt();
	}

	private handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			this.executeCommand(this.input.value.trim());
			this.input.value = '';
			this.historyIndex = -1;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (this.history.length > 0) {
				if (this.historyIndex === -1) {
					this.historyIndex = this.history.length;
				}
				if (this.historyIndex > 0) {
					this.historyIndex--;
					this.input.value = this.history[this.historyIndex];
				}
			}
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (this.historyIndex >= 0) {
				this.historyIndex++;
				if (this.historyIndex >= this.history.length) {
					this.historyIndex = -1;
					this.input.value = '';
				} else {
					this.input.value = this.history[this.historyIndex];
				}
			}
		} else if (e.key === 'Escape' && e.shiftKey) {
			e.preventDefault();
			this.handleTabCompletion();
		}
	}

	private handleInput() {
		const span = document.createElement('span');
		span.style.visibility = 'hidden';
		span.style.position = 'absolute';
		span.style.font = window.getComputedStyle(this.input).font;
		span.textContent = this.input.value || ' ';
		document.body.appendChild(span);
		const width = span.offsetWidth;
		document.body.removeChild(span);
		this.input.style.width = `${Math.max(20, width + 10)}px`;
	}

	/** Resolve a user-typed target (id, filename, or alias-with-extension) to a SiteFile. */
	private resolveFile(name: string): SiteFile | undefined {
		const key = name.toLowerCase();
		return this.filesByName.get(key) ?? this.filesById.get(key);
	}

	private handleTabCompletion() {
		const input = this.input.value.trim();
		const parts = input.split(' ');
		const command = parts[0];
		const arg = parts[1] || '';

		if ((command === 'open' || command === 'cd' || command === 'cat') && arg) {
			const allNames = [
				...Array.from(this.filesByName.keys()),
				...Array.from(this.filesById.keys()),
			];
			const matches = allNames.filter((name) => name.startsWith(arg.toLowerCase()));
			if (matches.length === 1) {
				this.input.value = `${command} ${matches[0]}`;
			} else if (matches.length > 1) {
				this.addOutput(Array.from(new Set(matches)).join('  '));
			}
		}
	}

	private executeCommand(command: string) {
		if (!command) {
			return;
		}

		this.history.push(command);
		this.addOutput(`${this.renderPrompt()} ${command}`, 'command');

		const parts = command.split(' ');
		const cmd = parts[0].toLowerCase();
		const args = parts.slice(1);

		switch (cmd) {
			case 'open':
			case 'cd':
			case 'cat':
				this.handleOpen(args);
				break;
			case 'ls':
				this.handleLs();
				break;
			case 'help':
				this.handleHelp();
				break;
			case 'clear':
				this.handleClear();
				break;
			case 'pwd':
				this.handlePwd();
				break;
			default:
				this.addOutput(`Command not found: ${cmd}. Type "help" for available commands.`);
		}
	}

	private openExternal(url: string) {
		const w = window.open(url, '_blank');
		if (w) w.opener = null;
	}

	/** Open a SiteFile: navigate to the route for internal files, new tab for external. */
	private openFile(file: SiteFile) {
		if (file.externalUrl) {
			this.addOutput(`Opening ${file.filename} in a new tab...`);
			this.openExternal(file.externalUrl);
			return;
		}

		if (file.url) {
			this.addOutput(`Opening ${file.filename}...`);
			const targetUrl = file.url;
			setTimeout(() => {
				window.location.href = targetUrl;
			}, 250);
			return;
		}

		this.addOutput(`Unable to open ${file.filename}: no URL configured.`);
	}

	private handleOpen(args: string[]) {
		if (args.length === 0) {
			this.addOutput('Usage: open <filename>');
			this.addOutput(`Available files: ${this.fileList().join(', ')}`);
			return;
		}

		const target = args[0];
		const file = this.resolveFile(target);

		if (file) {
			this.openFile(file);
		} else {
			this.addOutput(`open: no such file: ${target}`);
			this.addOutput(`Available files: ${this.fileList().join(', ')}`);
		}
	}

	private fileList(): string[] {
		return siteFiles.map((f) => f.filename);
	}

	private handleLs() {
		this.addOutput(this.fileList().join('  '));
	}

	private handleHelp() {
		this.addOutput('Available commands:');
		this.addOutput('  open <file>   - Open a file (e.g., open experience.ts)');
		this.addOutput('  cd <file>     - Alias for open');
		this.addOutput('  cat <file>    - Alias for open');
		this.addOutput('  Shift+Tab     - Complete filename after open/cd/cat');
		this.addOutput('  ls            - List available files');
		this.addOutput('  pwd           - Show current location');
		this.addOutput('  clear         - Clear terminal output');
		this.addOutput('  help          - Show this help message');
		this.addOutput('');
	}

	private handleClear() {
		this.output.innerHTML = '';
	}

	private handlePwd() {
		this.addOutput(`~/${this.getCurrentFileId()}`);
	}

	private addOutput(text: string, className: string = '') {
		const line = document.createElement('div');
		line.className = `terminal-line ${className}`;
		line.textContent = text;
		this.output.appendChild(line);
		this.scrollToBottom();
	}

	private scrollToBottom() {
		this.output.scrollTop = this.output.scrollHeight;
	}
}
