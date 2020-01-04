import { Component } from '@angular/core';

import { SettingsPage } from '../settings/settings';
import { TasksPage } from '../tasks/tasks';
import { ArticlesPage } from '../articles/articles';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = TasksPage;
  tab2Root = SettingsPage;
  tab3Root = ArticlesPage;

  constructor() {

  }

}
