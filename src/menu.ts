type StringCallable = () => string;

interface MenuOption {
  text: string | StringCallable;
  callback: () => void;
}

export class Menu {

  active = false;

  pointer = 0;

  options: MenuOption[] = [];

  staticOptions: string[] = [];

  activeMenu: Menu;

  parentMenu: Menu;

  constructor() {
    this.activeMenu = this;
  }

  addOption(option: MenuOption) {
    this.options.push(option);
  }

  addStaticOption(text: string) {
    this.staticOptions.push(text);
  }

  movePointer(offset: number) {
    this.activeMenu.pointer += offset;
    if (this.activeMenu.pointer < 0) {
      this.activeMenu.pointer = this.activeMenu.options.length - 1;
    } else if (this.activeMenu.pointer >= this.activeMenu.options.length) {
      this.activeMenu.pointer = 0;
    }
  }

  select() {
    this.activeMenu.selectedOption.callback();
  }

  get selectedOption() {
    return this.activeMenu.options[this.activeMenu.pointer];
  }

  addSubmenu(text: string, menu: Menu) {
    menu.parentMenu = this;
    this.options.push({
      text,
      callback: () => this.activeMenu = menu,
    });
  }

  clear() {
    this.options = [];
    this.staticOptions = [];
  }

  backToParent() {
    if (this.parentMenu) {
      this.parentMenu.activeMenu = this.parentMenu;
    }
  }
}
