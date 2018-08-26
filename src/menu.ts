type StringCallable = () => string;

interface MenuOption {
  text: string | StringCallable;
  callback: () => void;
}

export class Menu {

  active = false;

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
