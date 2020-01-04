import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Auth } from 'aws-amplify';
import { Push, PushObject, PushOptions } from '@ionic-native/push';

import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { SQLitePorter } from '@ionic-native/sqlite-porter';
import { DatabaseProvider } from '../providers/database';

import { TabsPage } from '../pages/tabs/tabs';
import { LoginPage } from '../pages/login/login';
import { SignupPage } from '../pages/signup/signup';
import { AboutPage } from '../pages/about/about';
import { SettingsPage } from '../pages/settings/settings';
import { ArticlesPage } from '../pages/articles/articles';
import { ArticlePage } from '../pages/article/article';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  
  /**
    * @name _DB
    * @type {object}
    * @private
    * @description     Defines an object for handling interfacing with the
    				           SQLite plugin
    */
    rootPage:any = null;




   /**
    * @name _DB_NAME
    * @type {object}
    * @private
    * @description     Defines the name of the SQLite database to be created
    */
   pages: Array<{title: string, component: any}>;
 

  

  constructor(platform          : Platform, 
	            statusBar         : StatusBar, 
	            splashScreen      : SplashScreen,
	            public push       : Push,
              public _DB        : DatabaseProvider,
              public alertCtrl  : AlertController) {

    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'Create account', component: SignupPage },
      { title: 'Login', component: LoginPage },
      { title: 'Settings', component: SettingsPage },
      { title: 'About', component: AboutPage }
    ];

    let globalActions = function() {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    };

    platform.ready()
      .then(() => {
        this.initDatabase();
        this.initPushNotification();
        Auth.currentAuthenticatedUser()
          .then(() => { this.rootPage = ArticlesPage; })
          .catch(() => { this.rootPage = ArticlesPage; })
          .then(() => globalActions());
      });
  }
     
  
 /**
  * @public
  * @method openPage
  * @description         Retrieve records from database and, on success, set hasData flag to true
  * @return {none}
  */
  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
  }



 /**
  * @public
  * @method initPushNotification
  * @description         Initializes Push notificataion
  * @return {none}
  */
  initDatabase()
  {
    this._DB.init()
      .then(() => console.log('Database finished initializing'))
      .catch(() => console.log('Database did not initialize'));
  }
   
   
   
    
 /**
  * @public
  * @method itemTapped
  * @param event     {any}      The event
  * @param item     {any}      The item
  * @description         Action to open a new page when a list item is tapped
  * @return {none}
  */
  openArticle(item) {
    console.log('Opening Article');
  }
    
   
   
    
 /**
  * @public
  * @method initPushNotification
  * @description         Initializes Push notificataion
  * @return {none}
  */
  initPushNotification()
  {

  	const options: PushOptions = {
  		android: {
  		  senderID: "603734027468"
  		},
      ios: {
          alert: "true",
          badge: "true",
          sound: "true"
      }
  	};
	  
    const pushObject: PushObject = this.push.init(options);
    
    pushObject.on('notification').subscribe((data: any) => {
      console.log('Received a notification', data)
    });

    pushObject.on('registration').subscribe((data: any) => {
      console.log("device token:", data.registrationId);
    });

    pushObject.on('error').subscribe(error => {
      console.error('Error with Push plugin', error)
    });
    
    pushObject.on('notification').subscribe((data: any) => {
      this._DB.importJSON(data)
      .then(response => console.log('New article importeed'))
      .catch(error => console.log('Could not import article'));
      let message = JSON.parse(data.message);
      if (data.additionalData.foreground) {
        let confirmAlert = this.alertCtrl.create({
          title: message.term.S,
          message: message.title.S,
          buttons: [{
          text: 'Ignore',
          role: 'cancel'
        },{
            text: 'View',
            handler: () => {
              this.openArticle(data);
            }
            }]
        });
        confirmAlert.present();
      }
    });
  }
}
