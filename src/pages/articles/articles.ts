import { Component } from '@angular/core';
import { AlertController, LoadingController, IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { Auth } from 'aws-amplify';
import { Moment } from 'moment';

import { DynamoDB } from '../../providers/providers';
import { DatabaseProvider } from '../../providers/database';

import { ArticlePage } from '../article/article';


@IonicPage()
@Component({
  selector: 'page-articles',
  templateUrl: 'articles.html',
})
export class ArticlesPage {


  /**
   * @name items
   * @type {object}
   * @public
   * @description     Stores all of the retrieved database table records
   */
  public items: any;


  /**
   * @name item
   * @type {object}
   * @public
   * @description     Stores all of the retrieved database table records
   */
  public item: any;


  /**
   * @name refresher
   * @type {object}
   * @public
   * @description     Stores all of the retrieved database table records
   */
  public refresher: any;


  /**
   * @name response
   * @type {object}
   * @public
   * @description     Stores all of the retrieved database table records
   */
  public response: any;


  /**
   * @name userId
   * @type {object}
   * @public
   * @description     Stores all of the retrieved database table records
   */
  private userId: string;


  /**
   * @name articlesTable
   * @type {object}
   * @public
   * @description     Stores all of the retrieved database table records
   */
  private articlesTable: string = 'aws-rss-whats-new';


  /**
   * @name selectedItem
   * @type {object}
   * @public
   * @description     Stores all of the retrieved database table records
   */
  selectedItem: any;


  /**
   * @name hasData
   * @type {Boolean}
   * @public
   * @description     Flag used in the template to control display of database records
   */
  public hasData : boolean 		= false;


  /**
   * @name technologies
   * @type {object}
   * @public
   * @description     Stores all of the retrieved database table records
   */
  public articles : any;


   /**
    * @name dataImported
    * @type {Boolean}
    * @public
    * @description     Flag used to determine whether data has been imported into the SQLite database
    */
   public dataImported : boolean 	= false;

    constructor(public navCtrl    : NavController, 
                public navParams  : NavParams,
                private _PLAT     : Platform,
                private _DB    	  : DatabaseProvider,
                public db         : DynamoDB,
                public loadingCtrl: LoadingController) 

    {
      Auth.currentCredentials()
        .then(credentials => {
          this.userId = credentials.identityId;
        })
        .catch(error => console.log(error.message)
      );
      let loading = this.loadingCtrl.create({
        content: 'Loading articles...'
      });

      loading.present();
      setTimeout(() => {
        this.loadRecords();
        loading.dismiss();
      } ,2000);
    }



    /**
     * @public
     * @method loadRecords
     * @description         Retrieve records from database and, on success, set hasData flag to true
     * @return {none}
     */
    loadRecords() : Promise<void>
    {
      return new Promise((resolve, reject) =>
      {
        this._DB
        .retrieveAllRecords('articles')
        .then((data : any) =>
        {
           this.articles 	= data;
           this.initializeItems();
        })
        .catch((e) =>
        {
          reject(e);
        });
      });
    }




   /**
    * @public
    * @method doRefresh
    * @param jsonFile     {any}      The JSON file data to be imported
    * @description         Import JSON file
    * @return {none}
    */  
    doRefresh(refresher) {
      console.log('Begin async operation', refresher);
      setTimeout(() => {
  	    this.refresher = refresher;
        this.initializeItems();
        refresher.complete();
        console.log('Async operation has ended');
      },1500);
    }
  



   /**
    * @public
    * @method itemTapped
    * @param event     {any}      The event
    * @param item     {any}      The item
    * @description         Action to open a new page when a list item is tapped
    * @return {none}
    */
    itemTapped(event, item) {
      this.navCtrl.push(ArticlePage, {
        item: item
      });
    }
  
  
  
  
   /**
    * @public
    * @method itemDelete
    * @param event     {any}      The event
    * @param item     {any}      The item
    * @description         Action to open a new page when a list item is tapped
    * @return {none}
    */
    itemDelete(event, item) {
      this._DB
        .deleteItem(item)
        .then((res) => {
          console.log(item.id);
          this.loadRecords();
        })
        .catch((error) => {
          console.log(error.message);
        });
    }
    
    
    
      
   /**
    * @public
    * @method initializeItems
    * @param event     {any}      The event
    * @param item     {any}      The item
    * @description         Action to open a new page when a list item is tapped
    * @return {none}
    */
    initializeItems() {
      console.log('initiailizing items');
      this.items = this.articles;
    }
  


  
   /**
    * @public
    * @method importJSON
    * @param jsonFile     {any}      The JSON file data to be imported
    * @description         Import JSON file
    * @return {none}
    */
    getItems(ev: any) {
      // Reset items back to all of the items
      this.initializeItems();

      // set val to the value of the searchbar
      const val = ev.target.value;

      // if the value is an empty string don't filter the items
      if (val && val.trim() != '') {
        this.items = this.items.filter((item) => {
          return (item.title.toLowerCase().indexOf(val.toLowerCase()) > -1);
        })
      }
    }
}
