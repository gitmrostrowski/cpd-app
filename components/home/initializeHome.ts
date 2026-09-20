/** Progressive enhancement for the supplied Home. Every listener is removed on navigation. */
export function initializeHome(root: HTMLElement) {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const bar = root.querySelector<HTMLElement>("#scrollProgress");
  const nav = root.querySelector<HTMLElement>("#mainNav");
  const pill = root.querySelector<HTMLElement>("#navPill");
  const links = Array.from(nav?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
  function update() {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = `${max > 0 ? window.scrollY / max * 100 : 0}%`;
    let active: HTMLAnchorElement | undefined;
    for (const link of links) {
      const section = root.querySelector(link.hash);
      if (section && section.getBoundingClientRect().top <= 100) active = link;
    }
    for (const link of links) link.classList.toggle("is-active", link === active);
    if (pill && nav) {
      pill.style.opacity = active ? "1" : "0";
      if (active) {
        pill.style.left = `${active.getBoundingClientRect().left - nav.getBoundingClientRect().left}px`;
        pill.style.width = `${active.offsetWidth}px`;
      }
    }
  }
  window.addEventListener("scroll", update, { ...options, passive: true });
  window.addEventListener("resize", update, options);
  update();

  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panes = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  function select(index: number) {
    tabs.forEach((tab, i) => {
      tab.classList.toggle("is-on", i === index);
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    panes.forEach((pane, i) => {
      pane.hidden = i !== index;
      pane.classList.toggle("is-on", i === index);
      pane.tabIndex = 0;
    });
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i), options);
    tab.addEventListener("keydown", event => {
      let next = i;
      if (["ArrowRight", "ArrowDown"].includes(event.key)) next = (i + 1) % tabs.length;
      else if (["ArrowLeft", "ArrowUp"].includes(event.key)) next = (i + tabs.length - 1) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault(); select(next); tabs[next].focus();
    }, options);
  });
  select(0);

  const trigger = root.querySelector<HTMLButtonElement>("#menuToggle")!;
  const drawer = root.querySelector<HTMLElement>("#sideDrawer")!;
  const backdrop = root.querySelector<HTMLButtonElement>("#drawerBackdrop")!;
  const close = root.querySelector<HTMLButtonElement>("#drawerClose")!;
  const previousOverflow = document.body.style.overflow;
  let opened = false;
  drawer.inert = true;
  function setOpen(value: boolean) {
    opened = value;
    drawer.inert = !value;
    drawer.classList.toggle("is-open", value);
    backdrop.classList.toggle("is-open", value);
    drawer.setAttribute("aria-hidden", String(!value));
    trigger.setAttribute("aria-expanded", String(value));
    trigger.setAttribute("aria-label", value ? "Zamknij menu" : "Otwórz menu");
    document.body.style.overflow = value ? "hidden" : previousOverflow;
    if (value) close.focus(); else trigger.focus();
  }
  trigger.addEventListener("click", () => setOpen(!opened), options);
  close.addEventListener("click", () => setOpen(false), options);
  backdrop.addEventListener("click", () => setOpen(false), options);
  drawer.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setOpen(false), options));
  document.addEventListener("keydown", event => {
    if (!opened) return;
    if (event.key === "Escape") setOpen(false);
    if (event.key === "Tab") {
      const items = Array.from(drawer.querySelectorAll<HTMLElement>("a[href],button"));
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }, options);
  window.addEventListener("resize", () => { if (opened && innerWidth > 860) setOpen(false); }, options);
  return () => { controller.abort(); document.body.style.overflow = previousOverflow; };
}
