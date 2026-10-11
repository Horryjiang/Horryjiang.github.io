(() => {
  'use strict';
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  function updateThemeLabel() {
    const dark = root.dataset.theme === 'dark';
    themeButton.setAttribute('aria-label', dark ? '切换浅色模式' : '切换深色模式');
    themeButton.setAttribute('aria-pressed', String(dark));
  }
  updateThemeLabel();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('fieldnotes-theme', root.dataset.theme); } catch (_) {}
    updateThemeLabel();
  });
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', '打开导航菜单');
      menu.focus();
    }
  });
  const dialog = document.querySelector('.search-dialog');
  const input = document.querySelector('#search-input');
  const results = document.querySelector('.search-results');
  const status = document.querySelector('.search-status');
  let index;
  let loading;
  let request = 0;
  function openSearch() {
    if (!dialog.open) dialog.showModal();
    input.focus();
  }
  document.querySelector('.search-open').addEventListener('click', openSearch);
  document.querySelector('.search-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch();
    }
  });
  input.addEventListener('input', async () => {
    const current = ++request;
    const query = input.value.trim().toLocaleLowerCase();
    results.replaceChildren();
    if (!query) {
      status.textContent = '输入关键词，找找感兴趣的内容。';
      return;
    }
    status.textContent = '正在查找…';
    try {
      if (!index) {
        if (!loading) loading = fetch(document.body.dataset.searchUrl).then(response => {
          if (!response.ok) throw new Error('Search index unavailable');
          return response.json();
        }).then(data => { index = data; }).finally(() => { loading = null; });
        await loading;
      }
      if (current !== request) return;
      const terms = query.split(/\s+/);
      const matches = index.filter(post => terms.every(term => [post.title, post.text, ...post.categories].join(' ').toLocaleLowerCase().includes(term)));
      status.textContent = matches.length ? `找到 ${matches.length} 篇文章${matches.length > 30 ? '，显示前 30 篇' : ''}` : '暂时没有找到，换个关键词试试。';
      matches.slice(0, 30).forEach(post => {
        const link = document.createElement('a');
        link.className = 'search-result';
        link.href = post.url;
        const title = document.createElement('strong');
        title.textContent = post.title;
        const excerpt = document.createElement('p');
        const position = post.text.toLocaleLowerCase().indexOf(terms[0]);
        const start = Math.max(0, position - 25);
        excerpt.textContent = (start ? '…' : '') + post.text.slice(start, start + 130) + (post.text.length > start + 130 ? '…' : '');
        link.append(title, excerpt);
        results.append(link);
      });
    } catch (_) {
      if (current === request) status.textContent = '搜索索引暂时无法加载，请检查网络后重新输入。';
    }
  });
  document.querySelectorAll('.prose figure.highlight').forEach(block => {
    const code = block.querySelector('.code pre');
    if (!code) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = '复制';
    button.setAttribute('aria-label', '复制代码');
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = '已复制';
      } catch (_) {
        button.textContent = '请手动复制';
      }
      setTimeout(() => { button.textContent = '复制'; }, 2000);
    });
    block.append(button);
  });
  if (document.querySelector('.article-page')) {
    const bar = document.querySelector('.reading-progress');
    const update = () => {
      const height = root.scrollHeight - root.clientHeight;
      bar.style.width = (height > 0 ? Math.min(100, Math.max(0, root.scrollTop / height * 100)) : 100) + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
})();
