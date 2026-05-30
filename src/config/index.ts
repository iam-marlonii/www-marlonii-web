export interface SiteFile {
	/** Stable id used by the terminal (matches the route slug). */
	id: string;
	/** Filename shown by `ls` and accepted by `open <name>` / `cat <name>`. */
	filename: string;
	/** Internal route. Used by the terminal to navigate. Optional when `externalUrl` is set. */
	url?: string;
	/** Opens in a new tab instead of navigating in-place. */
	externalUrl?: string;
}

export const siteFiles: SiteFile[] = [
	{ id: 'home', filename: 'home.md', url: '/' },
	{ id: 'about', filename: 'about.md', url: '/about' },
	{ id: 'resume', filename: 'resume.md', url: '/resume' },
	{ id: 'projects', filename: 'projects.md', url: '/projects' },
	{ id: 'contact', filename: 'contact.md', url: '/contact' },
	{ id: 'blog', filename: 'blog.md', url: '/blog' },
	{ id: 'tools', filename: 'tools.md', url: '/tools' },
	{ id: 'templates', filename: 'templates.md', url: '/templates' },
	{ id: 'privacy', filename: 'privacy.md', url: '/privacy' },
	{ id: 'terms', filename: 'terms.md', url: '/terms' },
	{ id: 'cheesecake', filename: 'cheesecake.md', url: '/cheesecake' },
];
