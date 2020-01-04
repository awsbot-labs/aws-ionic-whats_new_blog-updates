import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { SQLitePorter } from '@ionic-native/sqlite-porter';
import { DynamoDB } from './aws.dynamodb';

@Injectable()
export class DatabaseProvider {

  /**
    * @name _DB
    * @type {object}
    * @private
    * @description     Defines an object for handling interfacing with the
    				           SQLite plugin
    */
   private _DB 	: SQLiteObject;




   /**
    * @name _DB_NAME
    * @type {object}
    * @private
    * @description     Defines the name of the SQLite database to be created
    */
   private _DB_NAME : string 		= "awsbot.db";



  /**
   * @name articlesTable
   * @type {object}
   * @public
   * @description     Stores all of the retrieved database table records
   */
  private dynamodbTable: string = 'aws-rss-whats-new';
  
  
  
  
   constructor(public http 		     : HttpClient,
               private _PLAT       : Platform,
   			       private _SQL        : SQLite,
   			       private _PORTER     : SQLitePorter,
               private _DYNAMODB   : DynamoDB)
   { }
   
   
   
    /**
     * @public
     * @method init
     * @description          Creates the SQLite database
     * @return {none}
     */
    init() : Promise<any>
    {
       return new Promise((resolve, reject) =>
       {
         // Define the application SQLite database
         this._SQL.create({
            name 		  : this._DB_NAME,
            location 	  : 'default'
         })
         .then((db: SQLiteObject) =>
         {
            // Associate the database handler object with the _DB private property
           db.executeSql('CREATE TABLE IF NOT EXISTS articles (id TEXT PRIMARY KEY, channel_title TEXT, summary TEXT, published TEXT, term TEXT, channel_version TEXT, channel_description TEXT, link TEXT, channel_link TEXT, author TEXT, title TEXT);',{} as any)
             .then(() => {
               console.log('Executed SQL');
               this.retrieveJSONFile().catch(e => reject(e));
             })
             .catch(e => console.log(e.message));
           this._DB = db;
           resolve(db);
         })
         .catch((e) =>
         {
           reject(e);
         });
      });
    }
    
    
    
    
    
   /**
    * @public
    * @method retrieveJSONFile
    * @description         Retrieve remote JSON file using Angular HttpClient get method
    * @return {none}
    */
   retrieveJSONFile() : Promise<void>
   {
     return new Promise((resolve, reject) =>
     {
       const params = {
         'TableName': this.dynamodbTable
       };
       this._DYNAMODB.getDocumentClient()
         .then(client => client.scan(params).promise())
         .then(data => 
         { 
           console.log('Retrieving Json from DynamoDB');
           this.importJSON(data.Items);
         })
         .catch((e) => 
         { 
           reject(e);
         });
      });
   }




   /**
    * @public
    * @method dataExistsCheck
    * @param tableName    {String}          Name of table we want to check for data
    * @description          Checks that data exists within the specified SQLite table
    * @return {Promise}
    */
   dataExistsCheck(tableName : string) : Promise<any>
   {
      return new Promise((resolve, reject) =>
      {
        this._DB.executeSql('SELECT count(*) as numRows FROM ' + tableName, {} as any)
         .then((data : any) =>
         {
            var numRows = data.rows.item(0).numRows;
            resolve(numRows);
         })
         .catch((e) =>
         {
            reject(e);
         });
      });
   }




   /**
    * @public
    * @method retrieveAllRecords
    * @description          Retrieves all stored records from the technologies SQLite table
    * @return {Promise}
    */
   retrieveAllRecords(tableName : string) : Promise<any>
   {
      return new Promise((resolve, reject) =>
      {

        this._DB.executeSql('SELECT * FROM ' + tableName + ' ORDER BY published desc', {} as any)
         .then((data : any) =>
         {
            let items : any 	= [];
            if (data.rows.length > 0)
            {
               var k;

               // iterate through returned records and push as nested objects into
               // the items array
               for(k = 0; k < data.rows.length; k++)
               {
                 /* [id] PRIMARY KEY,
                  * [channel_title], 
                  * [summary], 
                  * [published], 
                  * [term], 
                  * [channel_version], 
                  * [channel_description], 
                  * [link], 
                  * [channel_link], 
                  * [author], 
                  * [title] 
                  */
                  items.push(
                  {
	                  id 			            : data.rows.item(k).id,
                    channel_title       : data.rows.item(k).channel_title,
                    summary             : data.rows.item(k).summary,
                    published           : data.rows.item(k).published,
                    term                : data.rows.item(k).term,
                    channel_version     : data.rows.item(k).channel_version,
                    channel_description : data.rows.item(k).channel_description,
                    link                : data.rows.item(k).link,
                    channel_link        : data.rows.item(k).channel_link,
                    author              : data.rows.item(k).author,
                    title               : data.rows.item(k).title,
                  });
               }
            }
            resolve(items);
         })
         .catch((error : any) =>
         {
            reject(error);
         });

      });
   }





   /**
    * @public
    * @method importJSON
    * @param json    {String}          The JSON data to be imported
    * @description          Imports the supplied JSON data to the application database
    * @return {Promise}
    */
   deleteItem(item : any) : Promise<any>
   {
      return new Promise((resolve, reject) =>
      {
         this._DB.executeSql('DELETE FROM articles where ID = "' + item['id'] + '"', {} as any)
         .then((data) =>
         {
            resolve(data);
         })
         .catch((e) =>
         {
            reject(e);
         });
      });
   }




  /**
   * @public
   * @method importJSON
   * @param json    {String}          The JSON data to be imported
   * @description          Imports the supplied JSON data to the application database
   * @return {Promise}
   */
  importJSON(json : any) : Promise<any>
  {
     let sqlJsonBlock = {
      "structure":{
          "tables":{
              "articles":"([id] PRIMARY KEY, [channel_title], [summary], [published], [term], [channel_version], [channel_description], [link], [channel_link], [author], [title] )"
          }
      },
       "data": {
           "inserts":{
               "articles": json
           }
       }
     };
     return new Promise((resolve, reject) =>
     {
        this._PORTER
        .importJsonToDb(this._DB, JSON.stringify(sqlJsonBlock))
        .then((data) =>
        {
           resolve(data);
        })
        .catch((e) =>
        {
           reject(e);
        });
     });
  }
  
  
  
  
   /**
    * @public
    * @method clear
    * @description          Removes all tables/data from the application database
    * @return {Promise}
    */
   clear() : Promise<any>
   {
      return new Promise((resolve, reject) =>
      {
         this._PORTER
         .wipeDb(this._DB)
         .then((data) =>
         {
            resolve(data);
         })
         .catch((e) =>
         {
            reject(e);
         });
      });
   }


}