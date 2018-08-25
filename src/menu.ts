interface MenuOption {
  text: string;
  callback: () => void;
}

export class Menu {

  constructor() {
    window.addEventListener('keydown', event => {
      if (!this.active) {
        return;
      }

      if (event.code === 'KeyW' || event.key === 'ArrowUp') {
        this.movePointer(-1);
      } else if (event.code === 'KeyS' || event.key === 'ArrowDown') {
        this.movePointer(1);
      } else if (event.key === 'Enter' || event.key === ' ' || event.code === 'KeyE') {
        this.select();
      }
    });
  }

  active = true;

  pointer = 0;

  options: MenuOption[] = [];

  addOption(option: MenuOption) {
    this.options.push(option);
  }

  movePointer(offset: number) {
    this.pointer += offset;
    if (this.pointer < 0) {
      this.pointer = this.options.length - 1;
    } else if (this.pointer >= this.options.length) {
      this.pointer = 0;
    }
  }

  select() {
    this.selectedOption.callback();
  }

  get selectedOption() {
    return this.options[this.pointer];
  }
}
