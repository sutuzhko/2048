type Child = Node | string;

interface ElOptions {
  readonly class?: string;
  readonly text?: string;
  readonly attrs?: Record<string, string>;
  readonly on?: Partial<Record<string, (event: Event) => void>>;
}

/** Компактный конструктор DOM-узлов — без литералов стилей, только классы и атрибуты. */
export const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElOptions = {},
  children: Child[] = [],
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (options.class) node.className = options.class;
  if (options.text !== undefined) node.textContent = options.text;
  if (options.attrs) {
    for (const [name, value] of Object.entries(options.attrs)) node.setAttribute(name, value);
  }
  if (options.on) {
    for (const [event, handler] of Object.entries(options.on)) {
      if (handler) node.addEventListener(event, handler);
    }
  }
  for (const child of children) node.append(child);
  return node;
};
