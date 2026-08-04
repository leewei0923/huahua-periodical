const STORAGE_KEY = 'theme-preference';
const FOCUS_KEY = 'focus-mode';
const root = document.documentElement;
const media = window.matchMedia('(prefers-color-scheme: dark)');

function getTheme() {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved === 'light' || saved === 'dark') return saved;
	} catch {
		// Storage can be unavailable in privacy-restricted browsers.
	}
	return media.matches ? 'dark' : 'light';
}

function applyTheme(theme) {
	root.dataset.theme = theme;
	root.style.colorScheme = theme;

	const toggle = document.querySelector('.theme-toggle');
	if (toggle) {
		const nextTheme = theme === 'dark' ? 'light' : 'dark';
		toggle.dataset.theme = theme;
		toggle.setAttribute('aria-label', `切换到${nextTheme === 'dark' ? '夜间' : '日间'}模式`);
		toggle.setAttribute('title', `切换到${nextTheme === 'dark' ? '夜间' : '日间'}模式`);
		toggle.setAttribute('aria-pressed', String(theme === 'dark'));
		const status = toggle.querySelector('.theme-status');
		if (status) status.textContent = `当前为${theme === 'dark' ? '夜间' : '日间'}模式`;
	}

	document.querySelector('meta[name="theme-color"]')
  ?.setAttribute('content', theme === 'dark' ? '#171717' : '#f7f7f7');
}

function initializeThemeControls() {
	applyTheme(getTheme());
	document.querySelector('.theme-toggle')?.addEventListener('click', () => {
		const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
		try {
			localStorage.setItem(STORAGE_KEY, theme);
		} catch {
			// The selected theme still applies for the current page.
		}
		applyTheme(theme);
	});

	const focusToggle = document.querySelector('.focus-toggle');
	if (!document.body.classList.contains('article-body')) {
		try {
			localStorage.removeItem(FOCUS_KEY);
		} catch {
			// Nothing else is required when storage is unavailable.
		}
		return;
	}
	let focusMode = false;
	try {
		focusMode = localStorage.getItem(FOCUS_KEY) === 'true';
	} catch {
		// Use the default when storage is unavailable.
	}
	document.body.classList.toggle('focus-mode', focusMode);
	focusToggle?.classList.toggle('active', focusMode);
	focusToggle?.setAttribute('aria-pressed', String(focusMode));

	const setFocusMode = (enabled) => {
		focusMode = enabled;
		document.body.classList.toggle('focus-mode', focusMode);
		focusToggle.classList.toggle('active', focusMode);
		focusToggle.setAttribute('aria-pressed', String(focusMode));
		focusToggle.setAttribute('aria-label', focusMode ? '退出专注模式' : '进入专注模式');
		try {
			localStorage.setItem(FOCUS_KEY, String(focusMode));
		} catch {
			// The selected mode still applies for the current page.
		}
	};

	focusToggle?.addEventListener('click', () => {
		setFocusMode(!document.body.classList.contains('focus-mode'));
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && document.body.classList.contains('focus-mode')) {
			setFocusMode(false);
			focusToggle?.focus();
		}
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializeThemeControls, { once: true });
} else {
	initializeThemeControls();
}

media.addEventListener('change', (event) => {
	try {
		if (localStorage.getItem(STORAGE_KEY)) return;
	} catch {
		// Fall through to the system preference.
	}
	applyTheme(event.matches ? 'dark' : 'light');
});
