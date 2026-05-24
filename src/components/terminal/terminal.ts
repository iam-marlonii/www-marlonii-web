export class Terminal {
	private container: HTMLElement;
	private input!: HTMLInputElement;
	private output!: HTMLElement;
	private history: string[] = [];
	private historyIndex: number = -1;
	private currentPath: string = '/';

	private readonly pages: Record<string, string> = {
		'about': '/about',
		'resume': '/resume',
		'projects': '/projects',
		'contact': '/contact',
		'blog': '/blog',
		'tools': '/tools',
		'templates': '/templates',
		'privacy': '/privacy',
		'terms': '/terms',
		'home': '/',
		'index': '/',
		'cheesecake': '/cheesecake',
	};

	constructor(container: HTMLElement) {
		this.container = container;
		this.init();
	}

	private init() {
		// Create terminal structure
		this.container.innerHTML = `
			<div class="terminal-output" id="terminal-output"></div>
			<div class="terminal-input-line">
				<span class="terminal-prompt">visitor@marlonii ~ %</span>
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

		// Add welcome message

		// Add welcome message / banner

		this.addOutput('--------------------------------');
		this.addOutput('Welcome to my website!');
		this.addOutput('Type "help" to see available commands.');
		this.addOutput('--------------------------------');
                                           
                                           

		// Set up event listeners
		this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
		this.input.addEventListener('input', () => this.handleInput());
		this.input.focus();

		// Focus input when clicking on terminal
		this.container.addEventListener('click', () => {
			this.input.focus();
		});
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
		} else if (e.key === 'Tab') {
			e.preventDefault();
			this.handleTabCompletion();
		}
	}

	private handleInput() {
		// Auto-resize input width based on content
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

	private handleTabCompletion() {
		const input = this.input.value.trim();
		const parts = input.split(' ');
		const command = parts[0];
		const arg = parts[1] || '';

		if (command === 'cd' && arg) {
			// Tab completion for cd command
			const matches = Object.keys(this.pages).filter(page => 
				page.startsWith(arg.toLowerCase())
			);
			if (matches.length === 1) {
				this.input.value = `cd ${matches[0]}`;
			} else if (matches.length > 1) {
				this.addOutput(matches.join('  '));
				this.addPrompt();
			}
		}
	}

	private executeCommand(command: string) {
		if (!command) {
			this.addPrompt();
			return;
		}

		// Add command to history
		this.history.push(command);
		this.addOutput(`visitor@marlonii ~ % ${command}`, 'command');

		const parts = command.split(' ');
		const cmd = parts[0].toLowerCase();
		const args = parts.slice(1);

		switch (cmd) {
			case 'cd':
				this.handleCd(args);
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
			case 'cat':
				this.handleCat(args);
				break;
			default:
				this.addOutput(`Command not found: ${cmd}. Type "help" for available commands.`);
				this.addPrompt();
		}
	}

	private handleCd(args: string[]) {
		if (args.length === 0) {
			this.currentPath = '/';
			this.addOutput('~');
			this.addPrompt();
			return;
		}

		const target = args[0].toLowerCase();
		if (this.pages[target]) {
			// Navigate to the page
			this.addOutput(`Navigating to ${target}...`);
			setTimeout(() => {
				window.location.href = this.pages[target];
			}, 300);
		} else {
			this.addOutput(`cd: no such page: ${target}`);
			this.addOutput(`Available pages: ${Object.keys(this.pages).filter(p => p !== 'home' && p !== 'index').join(', ')}`);
			this.addPrompt();
		}
	}

	private handleLs() {
		const pages = Object.keys(this.pages).filter(p => p !== 'home' && p !== 'index');
		this.addOutput(pages.join('  '));
		this.addPrompt();
	}

	private handleHelp() {
		this.addOutput('Available commands:');
		this.addOutput('  cd <page>     - Navigate to a page (e.g., cd resume)');
		this.addOutput('  ls            - List available pages');
		this.addOutput('  pwd           - Show current location');
		this.addOutput('  clear         - Clear terminal output');
		this.addOutput('  help          - Show this help message');
		this.addOutput('');
		this.addOutput('Available pages:');
		const pages = Object.keys(this.pages).filter(p => p !== 'home' && p !== 'index');
		pages.forEach(page => this.addOutput(` - ${page}`));
		// this.addOutput(`  ${Object.keys(this.pages).filter(p => p !== 'home' && p !== 'index').join(', ')}`);
		this.addPrompt();
	}

	private handleClear() {
		this.output.innerHTML = '';
		this.addPrompt();
	}

	private handlePwd() {
		this.addOutput(this.currentPath);
		this.addPrompt();
	}

	private handleCat(args: string[]) {
		if (args.length === 0) {
			this.addOutput('cat: missing file operand');
			this.addOutput('Try: cat <filename>');
		} else {
			this.addOutput(`cat: ${args[0]}: No such file or directory`);
		}
		this.addPrompt();
	}

	private addOutput(text: string, className: string = '') {
		const line = document.createElement('div');
		line.className = `terminal-line ${className}`;
		line.textContent = text;
		this.output.appendChild(line);
		this.scrollToBottom();
	}

	private addPrompt() {
		// Prompt is always visible in the input line, so we don't need to add it here
	}

	private scrollToBottom() {
		this.output.scrollTop = this.output.scrollHeight;
	}
}

