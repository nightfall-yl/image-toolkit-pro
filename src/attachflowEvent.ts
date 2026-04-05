export const getMouseEventTarget = (event: MouseEvent): HTMLElement => {
  event.preventDefault();
  return event.target as HTMLElement;
};
