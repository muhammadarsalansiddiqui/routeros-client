import { RouterOSAPI, RosException, Stream } from "node-routeros";
import { RouterOSAPICrud } from "./RosApiCrud";
import { RosApiCollection } from "./RosApiCollection";
import { SocPromise } from "./Types";

export class RosApiOperations extends RouterOSAPICrud {

    /**
     * Creates a set of operations to do over a menu
     * 
     * @param rosApi The raw API
     * @param path The menu path we are doing actions on
     * @param snakeCase If we should use snake_case
     */
    constructor(rosApi: RouterOSAPI, path: string, snakeCase: boolean) {
        super(rosApi, path, snakeCase);
    }

    /**
     * Limits the returned fields when printing
     * 
     * @param fields Fields to return
     */
    public select(fields: string | string[]): RosApiOperations {
        let commaFields: string = "=.proplist=";
        if (typeof fields === "string") fields = [fields];
        
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            if (/id|dead|nextid/.test(field)) fields[i] = "." + field;
        }

        // Convert array to a string comma separated 
        commaFields += fields;
        this.proplistVal = commaFields;
        return this;
    }

    /**
     * Alias for select()
     * @param fields Fields to return
     */
    public only(fields: string | string[]): RosApiOperations {
        return this.select(fields);
    }

    /**
     * Add an option to the command. As an example: count-only or detail
     * 
     * @param opts an option or array of options
     * @param args multiple strings of parameters of options
     */
    public options(opts: string | string[], ...args: string[]): RosApiOperations {
        if (typeof opts === "string") opts = [opts];
        opts = opts.concat(args || []);
        const optObj = {};
        for (const opt of opts) optObj[opt] = "";
        return this.where(optObj, "", false);
    }

    /**
     * Alias for select()
     * @param fields 
     */
    public proplist(fields: string | string[]): RosApiOperations {
        return this.select(fields);
    }

    /**
     * Filters the content when printing or define which item
     * will do actions to when not printing
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     * @param addQuestionMark if will start the sentence with a question mark (?), else, starts with equal (=)
     */
    public where(key: object | string, value: string = "", addQuestionMark: boolean = true): RosApiOperations {
        let search: object = new Object();
        if (typeof key === "string") {
            search[key] = value;
        } else {
            search = key;
        }
        this.makeQuery(search, addQuestionMark);
        return this;
    }

    /**
     * Alias to where, but without adding question marks
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public query(key: object | string, value?: string): RosApiOperations {
        return this.where(key, value);
    }

    /**
     * Alias to where, but without adding question marks
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public filter(key: object | string, value?: string): RosApiOperations {
        return this.where(key, value);
    }

    /**
     * Raw API syntax to be added to the stack
     * 
     * @param search array of sentences to send over the api
     */
    public whereRaw(search: string[]): RosApiOperations {
        this.queryVal = this.queryVal.concat(search);
        return this;
    }

    /**
     * Adds an OR operator when filtering content
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public orWhere(key: object | string, value?: string): RosApiOperations {
        this.where(key, value);
        this.queryVal.push("?#|");
        return this;
    }

    /**
     * Adds a NOT and then OR operator when filtering content
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public orWhereNot(key: object | string, value?: string): RosApiOperations {
        this.where(key, value);
        this.queryVal.push("?#!", "?#|");
        return this;
    }

    /**
     * Adds an AND operator when filtering content
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public andWhere(key: object | string, value?: string): RosApiOperations {
        this.where(key, value);
        this.queryVal.push("?#&");
        return this;
    }

    /**
     * Adds a NOT and then an AND operator when filtering content
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public andWhereNot(key: object | string, value?: string): RosApiOperations {
        this.where(key, value);
        this.queryVal.push("?#!", "?#&");
        return this;
    }

    /**
     * Adds an NOT operator when filtering content
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public whereNot(key: object | string, value?: string): RosApiOperations {
        this.where(key, value);
        this.queryVal.push("?#!");
        return this;
    }

    /**
     * Adds a HIGHER THAN (>) operator when filtering content
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public whereHigher(key: object | string, value?: string): RosApiOperations {
        this.where(">" + key, value);
        return this;
    }

    /**
     * Adds a LOWER THAN (<) operator when filtering content
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public whereLower(key: object | string, value?: string): RosApiOperations {
        this.where("<" + key, value);
        return this;
    }

    /**
     * Checks if the parameter or key exists by having a value when filtering
     * 
     * @param key the parameter to check
     */
    public whereExists(key: string): RosApiOperations {
        return this.whereHigher(key);
    }

    /**
     * Alias to whereExists
     * 
     * @param key the parameter to check
     */
    public whereNotEmpty(key: string): RosApiOperations {
        return this.whereHigher(key);
    }

    /**
     * Check if the parameter or key doesn't exist or has no value when filtering
     * 
     * @param key the parameter to check
     */
    public whereEmpty(key: string): RosApiOperations {
        this.where("-" + key);
        return this;
    }

    /**
     * Alias of whereEmpty
     * 
     * @param key the parameter to check
     */
    public whereNotExists(key: string): RosApiOperations {
        return this.whereEmpty(key);
    }

    /**
     * Prints the data of the menu
     * 
     * @param data optional filtering, like what you get when using the where function
     */
    public get(data?: object): SocPromise {
        if (data) this.makeQuery(data, true);
        const query = this.fullQuery("/print");
        return this.write(query);
    }

    /**
     * Alias of get
     * 
     * @param data optional filtering, like what you get when using the where function
     */
    public getAll(data?: object): SocPromise {
        return this.get(data);
    }

    /**
     * Alias of get, but in the process creates a collection
     * of each item returned
     * 
     * @param data optional filtering, like what you get when using the where function
     */
    public getCollection(data?: object): SocPromise {
        return this.get(data).then((results) => {
            for (let i = 0; i < results.length; i++) {
                results[i] = new RosApiCollection(this.rosApi, results[i], this.snakeCase);
            }
            return Promise.resolve(results);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    /**
     * Alias of get
     * 
     * @param data optional filtering, like what you get when using the where function
     */
    public print(data?: object): SocPromise {
        return this.get(data);
    }

    /**
     * Alias of find
     * 
     * @param data optional filtering, like what you get when using the where function
     */
    public first(data?: object): Promise<object> {
        return this.find(data);
    }

    /**
     * Returns the first item if found
     * 
     * @param data optional filtering, like what you get when using the where function
     */
    public find(data?: object): Promise<object> {
        return this.get(data).then((results) => {
            let result: object = new Object();
            if (results.length > 0) result = results[0];
            return Promise.resolve(result);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    /**
     * Alias of find
     * 
     * @param data optional filtering, like what you get when using the where function
     */
    public getOne(data?: object): Promise<object> {
        return this.find(data);
    }

    /**
     * Alias of find
     * 
     * @param data optional filtering, like what you get when using the where function
     */
    public getOnly(data?: object): Promise<object> {
        return this.find(data);
    }

    /**
     * Remove all entries of the current menu
     */
    public purge(): Promise<object> {
        return this.write([
            this.pathVal + "/print",
            "=.proplist=.id"
        ]).then((results) => {
            const ids = [];
            results.forEach((result) => {
                ids.push(result[".id"]);
            });
            return this.write([
                this.pathVal + "/remove",
                "=numbers=" + ids
            ]);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    /**
     * Start a streaming of content and returns a Stream object
     * so it can be paused, resumed or stopped
     * 
     * @param action optional action to add when streaming, like "listen" for example
     * @param callback 
     */
    public stream(action: any, callback?: () => void): Stream {
        if (typeof action === "function") {
            callback = action;
            action = "";
        }
        const query = this.fullQuery(action);
        return this.rosApi.stream(query, callback);
    }
    
}
