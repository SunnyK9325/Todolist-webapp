const express = require("express");
const mongoose = require("mongoose");                 // required the mongoose package 
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');                        // tells our app to use ejs as view engine, as ejs is not the only module that help us to do templeting but the easiest one and most node developers use it
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));                    // used to serve static files from a directory named "public".

// connect to the db server
// mongoose.connect("mongodb+srv://sunny9325:brago9325@cluster0.legztwk.mongodb.net/todolistDB", {useNewUrlParser: true});  // connect to the url where our mongodb hosted locally then / database name and , to avoid deprecation warning

// Defining Schema
const itemsSchema = {
    name: String
}

//defining model
const Item = mongoose.model("Item", itemsSchema);             // (<"SinglularCollectionName">, <schemaName>)

// defining some items using Item model
const item1 = new Item({                                    // creating a new document(record) from our Item model and passing the fields
    name: "Breakfast"
});

const item2 = new Item({
    name: "Lunch"
});

const item3 = new Item({
    name: "Dinner"
});

const defaultItems = [item1, item2, item3];

// defining schema for a random list
const listSchema = {
    name: String,
    items: [itemsSchema]           // array of itemsSchema type documents
};

// List model
const List = mongoose.model("List", listSchema);               // will create list documents based off this model

app.get("/", function(req, res) {
    Item.find({})
    .then((items)=>{
        if(items.length === 0) {
           //adding all of them in one go using insertMany function
            Item.insertMany(defaultItems)
            .then(() => {
                console.log("Successfully saved default items in DB");
            })
            .catch((err)=>{
                console.log(err);
            });
            res.redirect("/");
        } else {
            res.render("list", {listTitle: "Today", newListItems: items});         
        }
    })
    .catch((err)=>{
        console.log(err);
    });
    
});

app.post("/", function(req, res) {       // Our form is going to make a post request to the home route and it's going to post the value of our text input which has a name of newItem and this will caught by app.post method
    const itemName = req.body.newItem;
    
    const listName = req.body.list;
    const newItem = new Item({
        name: itemName
    });

    if(listName === "Today") {
        newItem.save();                  // this will save our newItem in our collection of items
        res.redirect("/");
    } else {
        List.findOne({name: listName}) 
        .then((foundList)=>{                    // we now know the name of the list in our lists collection but i just a name with that name we have to access the this list decoument of lists collection
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/" + listName);
        })
        .catch((err)=>{
            console.log(err);
        });
        
    }


});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    // check to see if we are making a post request to delete an item from the default list 
    // where the listName is today or if we're trying to delete an item from a custom list.
    
    if(listName === "Today") {
        Item.findByIdAndRemove(checkedItemId)
        .then(()=> {
            res.redirect("/");
        })
        .catch((err)=>{
            console.log(err);
        });
    } else {
        // we need to be able to find the list document that has the current 
        // listName and then we need to update that list to remove the checked item with that particular ID.
        List.findOneAndUpdate({name: listName}, {$pull : {items: {_id: checkedItemId}}})
        .then(()=> {
            res.redirect("/" + listName);
        })
        .catch((err)=> {
            console.log(err);
        });
    
    }


});


// handling route parameters

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName})      // find me a list (document) inside the collection of lists that has the name that's the same as the one that the user is currently trying to access,
    .then((foundItems)=> {
        if(!foundItems) {
            // create new list
            const newList = new List({         // new list document of our lists collection
                name: customListName,
                items: defaultItems
            });
        
            newList.save();
            res.redirect("/"+customListName);
        }
        else {
            // show existing list
            res.render("list", {listTitle: customListName, newListItems: foundItems.items});
        }
    })
    .catch((err) => {
        console.log(err);
    });

});


mongoose.connect("mongodb+srv://sunny9325:brago9325@cluster0.legztwk.mongodb.net/todolistDB", {useNewUrlParser: true}).then(
  app.listen(process.env.PORT || 3000, function() {
    console.log("Server started on port 3000");
  })
);
