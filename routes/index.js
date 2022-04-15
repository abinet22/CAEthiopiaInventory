const express = require('express');
const router = express.Router();

const connection = require('../database/dbconnection');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const uploadFile = require('../middleware/mutler');
const path = require('path');

const readXlsxFile = require('read-excel-file/node');
var Json2csvParser = require('json2csv').Parser;
const { v4: uuidv4 } = require('uuid');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const { json } = require('express');
router.get('/', forwardAuthenticated, (req, res) => res.render('login'));
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));
router.get('/forgetpassword', forwardAuthenticated, (req, res) => res.render('forgetpassword',{user:req.user}));
router.get('/dashboard', ensureAuthenticated, async function(req, res) {
var queries = [
  'select   customername, sum(total) as total from creditlog group by customername order by total desc',
   'select * from customer',
   'select   customername, sum(totalpayment) as totalpayment from creditreturnpayment  group by customername order by totalpayment desc'
   
];
connection.query(queries.join(';'),function(error,results,fields)
{
if(error)
{

  res.render('dashboard',{user:req.user,creditlog:'',customer:'',payment:''})
}
else{

  res.render('dashboard',{user:req.user,creditlog:results[0],customer:results[1],payment:results[2]})
}

});

});
router.get('/addaccount', ensureAuthenticated,async function (req, res) {
connection.query("select * from account",function(error,results,fields)
{
  if(error){

  }
  else
  {
    res.render('addaccount',{user:req.user,
      account:results
    })
  }
})

});
router.get('/addcustomer', ensureAuthenticated, async function(req, res) {
  connection.query("select * from customer",function(error,results,fields)
  {
    if(error){
  
    }
    else
    {
      res.render('addcustomer',{user:req.user,
        account:results
      })
    }
  })
});
router.get('/addinventory', ensureAuthenticated,async function (req, res) {
  connection.query("select * from inventory",function(error,results,fields)
  {
    if(error){
  
    }
    else
    {
      res.render('addinventory',{user:req.user,
        account:results
      })
    }
  })
});
router.get('/addsales', ensureAuthenticated, async function(req, res) { 

  var containernumber = [];
  var queries = ['SELECT  distinct containernumber  FROM productlist',
  'SELECT  *  FROM productlist',
  'SELECT  *  FROM customer',
  'SELECT  *  FROM account',
];
  connection.query(queries.join(';'),function(error,results,fields)
  {
    if(error)
    {
      res.render('addsales',{user:req.user,
        inventorylist:containernumber,
        containernumber:containernumber,
        customerlist:containernumber,

        account:containernumber
      })
    }
    else{
      res.render('addsales',{user:req.user,
        inventorylist:results[1],
        containernumber:results[0],
        customerlist:results[2],
        account:results[3]

      })
    }
  })

});
router.get('/bulkaddnewproduct', ensureAuthenticated, async function(req, res) { 


  var containernumber = [];
  var queries = ['SELECT  distinct containernumber  FROM productlist',
  'SELECT  *  FROM inventory',
  'SELECT  *  FROM customer',
  'SELECT  *  FROM account',
];
  connection.query(queries.join(';'),function(error,results,fields)
  {
  
    if(error)
    {
      res.render('bulkaddnewproduct',{user:req.user,
        inventorylist:containernumber,
        containernumber:containernumber,
        customerlist:containernumber,
        newproductlist:containernumber,
        account:containernumber
      })
    }
    else{
      res.render('bulkaddnewproduct',{user:req.user,
        inventorylist:results[1],
        containernumber:results[0],
        customerlist:results[2],
        account:results[3],
        newproductlist:containernumber

      })
    }
  })

});
router.get('/adduser', ensureAuthenticated, async function (req, res){ 
  connection.query("select * from users",function(error,results,fields)
  {
    if(error){
  
    }
    else
    {
      res.render('adduser',{user:req.user,
        account:results,

      })
    }
  })
});
router.get('/inventorytransaction', ensureAuthenticated, async function(req, res) {
  connection.query("select * from productlist",function(error,results,fields)
  {
if(error)
{
  res.render('inventorytransaction',{user:req.user,productlist:''})
}
else{

  res.render('inventorytransaction',{user:req.user,productlist:results})
}

  })

});
router.get('/salestransaction', ensureAuthenticated, async function (req, res) {
   res.render('salestransaction',{user:req.user})

});


router.get('/addpayment', ensureAuthenticated, async function(req, res) {
  var queries = [
    'select * from creditlog order by createdat desc',
    'select * from customer',
    'select * from account',
  ];
  connection.query(queries.join(';'),function(error,results,fields)
  {
  if(error)
  {
  
    res.render('addpayment',{user:req.user,creditlog:'',customerlist:'',account:''})
  }
  else{
  
    res.render('addpayment',{user:req.user,creditlog:results[0],customerlist:results[1],
      account:results[2],
    
    })
  }
  
  });
  
 
});
router.get('/addnewproduct', ensureAuthenticated, async function(req, res) {

  var result  = [];
  connection.query('select *from inventory',function(error,results,fields){
    if(error)
    {
      console.log(error);
      res.render('addnewproduct',{
        user:req.user,
        inventorylist:result
      })
    }
    else{
      res.render('addnewproduct',{
        user:req.user,
        inventorylist:results
      })
    }
  })
 
});

router.post('/addforgetpassword', forwardAuthenticated, async function(req, res) {res.render('forgetpassword',{user:req.user})});
router.post('/addnewaccount', ensureAuthenticated, async function(req, res) 

{
  const{bankname,accountnumber,intialbalance} = req.body;

  let errors = [];
  if(!bankname || !accountnumber || !intialbalance)
  {
   errors.push("PLease Enter Required Fields!")
  }
  if(errors.length > 0)
  {
    res.render('addaccount',{user:req.user,errors,error_msg:'Please All The Required Fields!'})
  }
  else{
    const v1options = {
      node: [0x01, 0x23],
      clockseq: 0x1234,
      msecs: new Date('2011-11-01').getTime(),
      nsecs: 5678,
    };
    accountid = uuidv4(v1options);
    var sql_query = "Insert into account (accountid,bankname,accountnumber,intialbalance) values (?,?,?,?)";
    connection.query(sql_query,[accountid,bankname,accountnumber,parseFloat(intialbalance)],function(error,results,fields)
    {
      if(error)
      {
        console.log(error);
        res.render('addaccount',{user:req.user,
          error_msg:'Connection Error PLease Try Later!'
          });
      }
      else
      {
        connection.query("select * from account",function(error,results,fields)
        {
          if(error){
        
          }
          else
          {
            res.render('addaccount',{user:req.user,
              account:results,
              success_msg:'You Are Successfully Add New Bank Account!'
            })
          }
        })
      
      }
    })
  
  }


});
router.post('/addnewcustomer', ensureAuthenticated, async function(req, res){ 
  const{customername,customeraddress,customerphone,intialbalance} = req.body;

  let errors = [];
  if(!customerphone || !customeraddress || !intialbalance || !customername)
  {
 errors.push('Please All The Required Fields!');
  }
  if(errors.length > 0)
  {
    res.render('addcustomer',{user:req.user,errors,error_msg:'Please All The Required Fields!'})
  }
  else{
    const v1options = {
      node: [0x01, 0x23],
      clockseq: 0x1234,
      msecs: new Date('2011-11-01').getTime(),
      nsecs: 5678,
    };
    customerid = uuidv4(v1options);
    
    var sql_query = "Insert into customer (customerid,customername,customeraddress,customerphone,intialbalance) values (?,?,?,?,?)";
  connection.query("select * from customer where customername='"+ customername +"'",
  function(error,results,fields){
    console.log(results)
     if(error)
     {
       console.log(error)
      res.render('addcustomer',{user:req.user,
        error_msg:'Connection Error Please Try Later!'
        });
     }
     else if(results.length > 0)
     {
    
      res.render('addcustomer',{user:req.user,
        error_msg:'Customer Name Already Registered Please Make It Unique!'
        });
     }
     else if(results.length == 0)
     {
  connection.query(sql_query,[customerid,customername,customeraddress,customerphone,parseFloat(intialbalance)],function(error,results,fields)
    {
      if(error)
      {
        console.log(error);
        res.render('addcustomer',{user:req.user,
          error_msg:'Connection Error Please Try Later!'
          });
      }
      else
      {
        connection.query("select * from customer",function(error,results,fields)
        {
          if(error){
        
          }
          else
          {
            res.render('addcustomer',{user:req.user,
              account:results,
              success_msg:'You Are Successfully Add New Customer Info!'
            })
          }
        })
       
      }
    })

     }



  });

  
  
  }


});
router.post('/addnewinventory', ensureAuthenticated, async function(req, res) { 
  const{inventorymanager,inventoryaddress,contactphone,inventoryname} = req.body;

  let errors = [];
  if(!inventorymanager || ! inventoryaddress || ! contactphone || !inventoryname)
  {
  errors.push('Please All The Required Fields!');
  }
  if(errors.length > 0)
  {
    res.render('addinventory',{user:req.user,errors,error_msg:'Please All The Required Fields!'})
  }
  else{
    const v1options = {
      node: [0x01, 0x23],
      clockseq: 0x1234,
      msecs: new Date('2011-11-01').getTime(),
      nsecs: 5678,
    };
    inventoryid = uuidv4(v1options);
    var sql_query = "insert into inventory (inventoryid,inventorymanager,inventoryaddress,contactphone,inventoryname) values (?,?,?,?,?)";
    connection.query(sql_query,[inventoryid,inventorymanager,inventoryaddress,contactphone,inventoryname],function(error,results,fields)
    {
      if(error)
      {
        res.render('addinventory',{user:req.user,
          error_mgs:'Connection Error PLease Try Later!'
          });
      }
      else
      {
        connection.query("select * from inventory",function(error,results,fields)
        {
          if(error){
        
          }
          else
          {
            res.render('addinventory',{user:req.user,
              account:results,
              success_mgs:'You Are Successfully Add New Inventory Info!'
            })
          }
        })
      
      }
    })
  
  }



});

router.post('/adduser',ensureAuthenticated,async function(req,res)
{
    const {username,password,repassword,email,userroll} = req.body;
let errors = [];
var userlist =[];
connection.query('Select * from users', function(error, results, fields) {
  if (error) 
      {
        errors.push({ msg: 'Please add all required fields' });
      }
  else
  {
    userlist = results;
  }
});
if (!username || !password || !repassword || !email || !userroll ){
  errors.push({ msg: 'Please add all required fields' });
 
}
console.log(userroll);
if (errors.length > 0) {
  res.render('adduser', {
    errors,
    userlist:userlist,user:req.user
  });
}
else if (userroll == 0 ){
  res.render('adduser', {
    error_msg:'Please select user roll'
    ,user:req.user
  });
 
}
else if( password != repassword)
{
  res.render('settings', {
    userlist:userlist,
  error_msg:'Password not match',user:req.user
    
  });
}
 else {
  const v1options = {
    node: [0x01, 0x23],
    clockseq: 0x1234,
    msecs: new Date('2011-11-01').getTime(),
    nsecs: 5678,
  };
  userid = uuidv4(v1options);

  connection.query('Select * from users where username=? ', username, function(error, results, fields) {
      if (error) 
          {
              console.log(error);
          }
     else if(results.length>0)
       {
          res.render('adduser',
          {  userlist:userlist,
              error_msg:'User Name Already There',user:req.user
          })
      }
      else
      {
          bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(password, salt, (err, hash) => {
                if (err) throw err;
              var  newpassword = hash;
              connection.query('Insert into users(username,password,userroll,email,userid,isactive) values(?,?,?,?,?,?) ', [username,newpassword,userroll,email,userid,"Yes"], function(error, results, fields) {
                  if (error) 
                      {
                        console.log(error);
                        res.render('adduser',{
                          userlist:userlist,
                          error_msg:'Something is wrong please try later',user:req.user
                        })
                      }
                  else
                  {
                    connection.query("select * from users",function(error,results,fields)
                    {
                      if(error){
                    
                      }
                      else
                      {
                        res.render('adduser',{user:req.user,
                          account:results,
                          success_msg:'You are successfully add new system user',user:req.user
                 
                        })
                      }
                    })
                 
                  }
                 
              });
              });
            });
          
      
       
      }
     
  });

 }
   
});
router.post('/loadinventorytransaction', ensureAuthenticated, async function(req, res)  {res.render('inventorytransaction',{user:req.user})});
router.post('/laodsalestransaction', ensureAuthenticated, async function(req, res) {res.render('salestransaction',{user:req.user})});
router.post('/laoddata', ensureAuthenticated, async function(req, res)  {res.render('data',{user:req.user})});
router.post('/acceptcreditpayment', ensureAuthenticated, async function(req, res) {
  
  const{customername,customerid,paymentoption,amount,bankaccount,transactionnumber,note} = req.body;
  var queries = [
    'select * from creditlog order by createdat desc',
    'select * from customer',
    'select * from account',
  ];
   if(!customername ||!customerid ||!paymentoption ||!amount)
{
  res.render('addpayment',{user:req.user,creditlog:'',customerlist:'',account:'',
  error_mgs:'Please enter all required fileds'
})
}
else
{
  var querypayment = "insert into creditreturnpayment (paymentid,customerid,customername,paymentoption,totalpayment,transactionid,accountname,createdat,notes) "+
  " values (?,?,?,?,?,?,?,?,?)";
  var queryudtbalancecust = "update customer set intialbalance = intialbalance + "+amount+" where customername = '"+ customername +"' && customerid = '"+ customerid +"'";
  var  payementvalues = ["id",customerid,customername,paymentoption,amount,transactionnumber,bankaccount,new Date(),note];
 
connection.query(querypayment,payementvalues,function(error,results,fileds)
{
  if(error)
  {
    console.log(error);
    res.render('addpayment',{user:req.user,creditlog:'',customerlist:'',account:''})
  }
  else{
    connection.query(queryudtbalancecust,function(error,results,fileds)
            {
          if(error)
          {

            console.log(error);
            res.render('addpayment',{user:req.user,creditlog:'',customerlist:'',account:''})
          }
          else{
            connection.query(queries.join(';'),function(error,results,fields)
            {
            if(error)
            {
              console.log(error);
              res.render('addpayment',{user:req.user,creditlog:'',customerlist:''})
            }
            else{
            
              res.render('addpayment',{user:req.user,creditlog:results[0],customerlist:results[1],
                account:results[2],
              
              })
            }
            
            });
          }
        });
  }
})


}
 

});
router.post('/addnewproduct', ensureAuthenticated, async function(req, res)  {
  let errors;
  const{invnetoryname,containernumber,productcode,buyingprice,currentquantity,additionalcost,sellingprice,productdescription} = req.body;
  if(!invnetoryname ||!containernumber ||!productcode ||!buyingprice ||!currentquantity ||!additionalcost||!sellingprice ||!productdescription)
  {
errors.push('Please enter all required fields');
  }

  else{
    var sql_query = "insert into productlist (invnetoryname,containernumber,productcode,buyingprice,currentquantity,additionalcost,sellingprice,productdescription)"+
    " values(?,?,?,?,?,?,?,?)";
    var valtoadd =[ invnetoryname,containernumber,productcode,buyingprice,currentquantity,additionalcost,sellingprice,productdescription]
   connection.query(sql_query,valtoadd,function(error,results,fields)
   {
if(error)
{
  console.log(error);
  res.render('addnewproduct',{
    user:req.user,
    error_msg:'Something Is Wrong Please Try later!'

  })
}

else{
  res.render('addnewproduct',{
    user:req.user,
    success_msg:'You Are Successfully Added New Product To Inventory!'

  })
}
   });

 
  }


});
router.post('/addnewinventorylist',async function(req,res)
{
    const {pTableData} = req.body;
   console.log(pTableData);
 
   var result  = [];
   connection.query('select *from inventory',function(error,results,fields){
     if(error)
     {
       console.log(error);
     
       result =''
     }
     else{
      result =results
     }
   })
const postdate = new Date();
  var values = [];
  var inventory = [];
const copyItems = [];
myObj = JSON.parse(pTableData);

for (let i = 0; i < myObj.length; i++) {
  copyItems.push(myObj[i]);
}
  if(copyItems.length >0)
  {

copyItems.forEach((item) => {
  //console.log(item.UnitPrice); item.ShelveNumber 
  var productcode  = item.productcode ;
  var inventoryname  = item.inventory ;
  var containernumber  = item.containerid ;
  
  // inventory.push([req.user.assignshop,req.user.assignshop,item.ProductId,"catid",item.ProductCategory,item.ProductDescription,item.NewQuantity,item.ShelveNumber,postdate]);

  // values.push([req.user.userid,req.user.assignshop,item.ProductId,item.ProductCategory,item.ProductDescription,item.NewQuantity,item.BuyingPrice,postdate]);

  connection.query("Select * from productlist where containernumber='"+ containernumber+"' && productcode='"+ productcode +"' && invnetoryname='"+ inventoryname +"'", function (error, results, fields) {
        
    if (error)
    {
      console.log(error);
      // res.json({messages:'error'});  
    }
   else if(results.length == 0)
    {
      var sql1 = "INSERT INTO productlist (invnetoryname, cartonnumber, containernumber,productcode, productdescription, productsize, noofcarton, quantitypercarton, unit, currentquantity"+
      ") VALUES(?,?,?,?,?,?,?,?,?,?)";
      var sql2 = "INSERT INTO productlog (invnetoryname, cartonnumber, containernumber,productcode, productdescription, productsize, noofcarton, quantitypercarton, unit, currentquantity"+
      ",createdat) VALUES(?,?,?,?,?,?,?,?,?,?,?)";
  
      connection.query(sql1,[item.inventory,item.cartonnumber,item.containerid,item.productcode,item.productdescription,item.productsize,
        item.totalcarton,item.quantity,item.unit,item.totalamount], function (error, results, fields) {
  
        if (error) {
          console.log(error);
        //  res.json({messages:'error'});  
        }
        connection.query(sql2,[item.inventory,item.cartonnumber,item.containerid,item.productcode,item.productdescription,item.productsize,
          item.totalcarton,item.quantity,item.unit,item.totalamount,new Date()], function(err,result) {
          if (error) 
          {
            console.log(error);
            //res.json({messages:'error'});  
          }
          // res.render('addnewproduct',{user:req.user,success_mgs:'you are successfully add new products to inventroy'});
         
        }); 
       
        
        });
   
    }
    else{
      var sqludt = "UPDATE productlist SET currentquantity = currentquantity + "+ item.totalamount +" WHERE productcode = "+ "'"+ item.productcode +"'" + " && containernumber = '"+ item.containerid + "'";
      connection.query(sqludt, function (error, results, fields) {
  
        if (error){
          console.log(error);
         // res.json({messages:'error'});  
        }
        connection.query(sql2,[item.inventory,item.cartonnumber,item.containerid,item.productcode,item.productdescription,item.productsize,
          item.totalcarton,item.quantity,item.unit,item.totalamount,new Date()], function(err,result) {
          if (error) 
          {
            console.log(error);
            //res.json({messages:'error'});  
          }
        
        
        }); 
       
        
        });
     
    }
    });

});
res.json({messages:'success'});  
  }
  else{
    
    res.json({messages:'error'});  
  }


   
});
router.post('/uploadinventorydata', ensureAuthenticated,uploadFile.single("inventorydata"), async function (req, res) {
  //importExcelData2MySQL( __dirname + "../../uploads/"  + req.file.filename);
  const{invnetoryname,containernumber} = req.body;
  //console.log(invnetoryname);


  var exceldata = [];

if(!invnetoryname || !containernumber)
{
  res.render('bulkaddnewproduct',{user:req.user,
    inventorylist:'',
    containernumber:'',
    customerlist:'',
    account:'',
    newproductlist:exceldata,
    error_msg:'Please select inventory and add container id'

  })
}
else{
  readXlsxFile(path.join(__dirname,"../uploads/",req.file.filename)).then((rows) => {
    // `rows` is an array of rows
    // each row being an array of cells.     
   // console.log(rows);e
  // var datas = JSON.stringify(e);
  // console.log(datas);
    rows.shift();
    var newvarobj = [];
    var sql1 = "INSERT INTO productlist (invnetoryname, cartonnumber, containernumber,productcode, productdescription, productsize, noofcarton, quantitypercarton, unit, currentquantity,ischecked"+
    ") VALUES(?,?,?,?,?,?,?,?,?,?,?)";
    var sql2 = "INSERT INTO productlog (invnetoryname, cartonnumber, containernumber,productcode, productdescription, productsize, noofcarton, quantitypercarton, unit, currentquantity"+
    ",createdat) VALUES(?,?,?,?,?,?,?,?,?,?,?)";

    rows.forEach((row) => {

      var crtnno = row[0];
      var procode =row[1];
      var prodes =row[2];
      var nocrtn =row[3];
      var qtypercrtn =row[4];
      var qty =row[5];
      var prosize =row[6];
console.log(row[6]);

    var bigo = {}
    bigo.inventoryname = invnetoryname;
    bigo.cartonno = crtnno;
    bigo.containerid = containernumber;
    bigo.procode = procode;
    bigo.prodesc = prodes;
    bigo.prosize = prosize;
    bigo.noofcrtn = nocrtn;
    bigo.qtypercrtn = qtypercrtn;
    bigo.unit = "PRS";
    bigo.qty = qty;
        var valuesplist = [ invnetoryname, String(crtnno),containernumber,String(procode),String(prodes),String(prosize),parseInt(nocrtn),parseInt(qtypercrtn),"PRS",parseInt(qty)];

        var valuespl =[ invnetoryname, String(crtnno),containernumber,String(procode),String(prodes),String(prosize),parseInt(nocrtn),parseInt(qtypercrtn),"PRS",parseInt(qty),new Date()];
      
        newvarobj.push(bigo);
      
        console.log(newvarobj);
        // connection.query(sql1, valuesplist, (error, response) => {
        //     // console.log(error || response);
        //     // console.log(response.message);
        //     if(error)
        //     {

        //         console.log(error);
        //         res.render('bulkaddnewproduct',{
        //             user:req.user,
        //             error_msg:'Error occurs please try again',
        //             trainees:'',
        //             current: 1,
        //             pages: 10,
        //         })
        //         //return(error);
        //     }
        //     else{
        //       var productlist = [];
    
        //       let errors = [];
        //       var  sql1 =" SELECT * FROM productlist  where ischecked='No' ORDER BY id DESC LIMIT 0,100";
        //       var sql2  ="Select count(*) AS namesCount from productlist  ORDER BY id DESC";
        //        connection.query(sql2, function(error, rowno, fields) {
        //          if (error) 
        //            {
        //              errors.push({ msg: 'Cant load inventorydata please refresh!' });
        //              res.render('bulkaddnewproduct',{
        //                errors,
        //                productlist:productlist,
        //                user:req.user,
        //                current: 1,
        //                pages: 10,
        //              });
        //            }
        //        else
        //        { 
        //          var  numRows = rowno[0].namesCount;
        //      var  numPages = Math.ceil(numRows / 100);
        //         connection.query(sql1, function(error, results, fields) {
        //             if(error)
        //             {

        //             }
        //            // console.log(results)
        //             res.render('bulkaddnewproduct',{
        //               errors,
        //               current: 1,
        //               pages: numPages,
        //               productlist:results,
        //               user:req.user,
        //               success_msg:'You have successfully added ' + response.affectedRows + ' new products record.'
        
        //             });
        //         });
             
        //        }
        //        });
               
        //        // return(response.affectedRows);
        //     }
        //     });

    });
   
  
    res.render('bulkaddnewproduct',{user:req.user,
      inventorylist:'',
      containernumber:'',
      customerlist:'',
      account:'',
      newproductlist:newvarobj

    })
    });

}


});



router.post('/addnewtransaction',async function(req,res)
{
    const {pTableData} = req.body;
   console.log(pTableData);
 
   var containernumber = [];
   var queries = ['SELECT  distinct containernumber  FROM productlist',
   'SELECT  *  FROM productlist',
   'SELECT  *  FROM customer',
   'SELECT  *  FROM account',
 ];
   connection.query(queries.join(';'),function(error,results,fields)
   {
     if(error)
     {
      
         inventorylist=containernumber;
         containernumber=containernumber;
         customerlist=containernumber
         account=containernumber
       
     }
     else{
     
         inventorylist=results[1];
         containernumber=results[0];
         customerlist=results[2];
         account=results[3];
 
       
     }
   })

const copyItems = [];
myObj = JSON.parse(pTableData);
console.log(myObj);
console.log(pTableData);
for (let i = 0; i < myObj.length; i++) {
  copyItems.push(myObj[i]);
}
  if(copyItems.length >0)
  {

copyItems.forEach((item) => {
  //console.log(item.UnitPrice); item.ShelveNumber 
  var productcode  = item.productcode ;
  var paymentoption  = item.paymentoption;
  var inventoryname  = item.inventory ;
  var containernumber  = item.containerid ;

  if(paymentoption =="Credit")
  {
    var sqludt = "UPDATE productlist SET currentquantity = currentquantity - "+ item.quantity +" WHERE productcode = "+ "'"+ item.productcode +"'" + " && containernumber = '"+ item.containerid + "'";
    var sqlcustomer = "UPDATE customer SET intialbalance = intialbalance - "+ item.total +" WHERE customername = "+ "'"+ item.customername +"'";
   
    var sql2 = "INSERT INTO transactionlog (containerid,productcode, productdescription, unitprice,quantity, total, customername, paymentoption,"+
    "transactionid,bankname,createdat) VALUES(?,?,?,?,?,?,?,?,?,?,?)";
    
    var sqlcredit = "INSERT INTO creditlog (containerid,productcode, productdescription, unitprice,quantity, total, customername, createdat) VALUES(?,?,?,?,?,?,?,?)";
    
   
    connection.query(sql2,[item.containerid,item.productcode,item.productdescription,
    item.unitprice,item.quantity,item.total,item.customername,item.paymentoption,item.transactionid,item.bankname, new Date()
    ], function (error, results, fields) {
  
      if (error) {
        console.log(error); 
       //  res.json({messages:'error'});  
      }
      connection.query(sqludt, function(err,result) {
        if (error) 
        {
          console.log(error);
          //res.json({messages:'error'});  
        }
        connection.query(sqlcredit,[item.containerid,item.productcode,item.productdescription,
          item.unitprice,item.quantity,item.total,item.customername,new Date()
          ], function(err,result) {
          if (error) 
          {
            console.log(error);
            //res.json({messages:'error'});  
          }
          connection.query(sqlcustomer, function(err,result) {
            if (error) 
            {
              console.log(error);
              //res.json({messages:'error'});  
            }
            // res.render('addnewproduct',{user:req.user,success_mgs:'you are successfully add new products to inventroy'});
           
          }); 
        }); 
      }); 
     
      
      });
  }
  else{
    var sqludt = "UPDATE productlist SET currentquantity = currentquantity - "+ item.quantity +" WHERE productcode = "+ "'"+ item.productcode +"'" + " && containernumber = '"+ item.containerid + "'";
   
    var sql2 = "INSERT INTO transactionlog (containerid,productcode, productdescription, unitprice,quantity, total, customername, paymentoption,"+
    "transactionid,bankname,createdat) VALUES(?,?,?,?,?,?,?,?,?,?,?)";
   // var sqlcustomer = "UPDATE customer SET intialbalance = intialbalance - "+ item.total +" WHERE customername = "+ "'"+ item.customername +"'";
   
  //  var sqlcredit = "INSERT INTO creditlog (containerid,productcode, productdescription, unitprice,quantity, total, customername, createdat) VALUES(?,?,?,?,?,?,?,?)";
    
    connection.query(sql2,[item.containerid,item.productcode,item.productdescription,
    item.unitprice,item.quantity,item.total,item.customername,item.paymentoption,
    item.transactionid,item.bankname,new Date()
    ], function (error, results, fields) {
  
      if (error) {
        console.log(error); 
       //  res.json({messages:'error'});  
      }
      connection.query(sqludt, function(err,result) {
        if (error) 
        {
          console.log(error);
          //res.json({messages:'error'});  
        }
        // res.render('addnewproduct',{user:req.user,success_mgs:'you are successfully add new products to inventroy'});
       
      }); 
     
      
      });
  }


});
res.json({messages:'success'});  
  }
  else{
    
    res.json({messages:'error'});  
  }


   
});




router.get('/viewcredithistory/(:customername)', ensureAuthenticated, async function(req, res) {
  var queries = [
    "select * from creditlog where customername ='"+req.params.customername+"'",
     'select * from customer',
     'select   customername, sum(totalpayment) as totalpayment from creditreturnpayment  group by customername order by totalpayment desc'
     
  ];
  connection.query(queries.join(';'),function(error,results,fields)
  {
  if(error)
  {
  
    res.render('credithistory',{user:req.user,creditlog:'',customer:'',payment:''})
  }
  else{
  
    res.render('credithistory',{user:req.user,creditlog:results[0],customer:results[1],payment:results[2]})
  }
  
  });
  
  });
router.get('/viewpaymenthistory/(:customername)', ensureAuthenticated, async function(req, res) {
    var queries = [
      "select * from creditreturnpayment where customername ='"+req.params.customername+"'",
       'select * from customer',
       'select   customername, sum(totalpayment) as totalpayment from creditreturnpayment  group by customername order by totalpayment desc'
       
    ];
    connection.query(queries.join(';'),function(error,results,fields)
    {
    if(error)
    {
    
      res.render('paymenthistory',{user:req.user,creditlog:'',customer:'',payment:''})
    }
    else{
    
      res.render('paymenthistory',{user:req.user,creditlog:results[0],customer:results[1],payment:results[2]})
    }
    
    });
    
    });


router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});

router.post('/populatesaletransaction',async function(req,res)
{
  

  var searchStr = req.body.search.value;

  var recordsTotal = 0;
  var recordsFiltered=0;
  // var skip = (page-1) * req.body.draw; 
  // var limit = skip + ',' + numPerPage; 
  connection.query("Select count(*) AS namesCount from transactionlog where  productcode LIKE "+"'"+ searchStr +"%' ORDER BY customername DESC", function(error, rows, fields) {
    if (error) 
        {
            console.log(error);
        }
    else
    {
      recordsTotal = rows[0].namesCount;
      recordsFiltered=recordsTotal;
      console.log(recordsFiltered);
       console.log(req.body.draw);
        console.log(req.body.length);
       connection.query("SELECT *  FROM transactionlog where productcode LIKE "+"'"+ searchStr +"%'"+" ORDER BY customername DESC LIMIT "+req.body.start +","+ req.body.length +""
       , function (error, results,fields) {
               if (error) {
                   console.log('error while getting results'+error);
                   return;
               }
       
               var data = JSON.stringify({
                   "draw": req.body.draw,
                   "recordsFiltered": recordsFiltered,
                   "recordsTotal": recordsTotal,
                   "data": results
               });
            //   console.log("data", data);
               res.send(data);
           });

    }
 

  })
        
 
   
});

router.post('/populateinventorylist',async function(req,res)
{
  

  var searchStr = req.body.search.value;

  var recordsTotal = 0;
  var recordsFiltered=0;
  // var skip = (page-1) * req.body.draw; 
  // var limit = skip + ',' + numPerPage; 
  connection.query("Select count(*) AS namesCount from productlist where  productcode LIKE "+"'"+ searchStr +"%' ORDER BY currentquantity DESC", function(error, rows, fields) {
    if (error) 
        {
            console.log(error);
        }
    else
    {
      recordsTotal = rows[0].namesCount;
      recordsFiltered=recordsTotal;
      console.log(recordsFiltered);
       console.log(req.body.draw);
        console.log(req.body.length);
       connection.query("SELECT *  FROM productlist where productcode LIKE "+"'"+ searchStr +"%'"+" ORDER BY currentquantity DESC LIMIT "+req.body.start +","+ req.body.length +""
       , function (error, results,fields) {
               if (error) {
                   console.log('error while getting results'+error);
                   return;
               }
       
               var data = JSON.stringify({
                   "draw": req.body.draw,
                   "recordsFiltered": recordsFiltered,
                   "recordsTotal": recordsTotal,
                   "data": results
               });
            //   console.log("data", data);
               res.send(data);
           });

    }
 

  })
        
 
   
});

router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/login');
});
router.get('/downloadinventorytemplate', function(req, res){
  const file = __dirname + "../../uploads/InventoryListTemplate.xlsx";
  res.download(file); // Set disposition and send it.
});

router.post('/deletecustomer/(:customerid)',ensureAuthenticated,async function(req,res){
var qrydt = "delete  from customer where customerid='"+req.params.customerid+"'";
connection.query(qrydt,function(error,results,fields){
  if(error)
  {

  }
  connection.query("select * from customer",function(error,results,fields)
  {
    if(error){
  
    }
    else
    {
      res.render('addcustomer',{user:req.user,
        account:results,
        success_msg:'You Are Successfully  Delete Customer Info!'
      })
    }
  })
})

});
router.post('/deleteaccount/(:accountid)',ensureAuthenticated,async function(req,res){

var qrydt = "delete  from account where accountid='"+req.params.accountid+"'";
connection.query(qrydt,function(error,results,fields){
  if(error)
  {

  }
  connection.query("select * from account",function(error,results,fields)
  {
    if(error){
  
    }
    else
    {
      res.render('addaccount',{user:req.user,
        account:results,
        success_msg:'You Are Successfully  Delete Account Info!'
      })
    }
  })
})
});
router.post('/deleteinventory/(:inventoryid)',ensureAuthenticated,async function(req,res){
 
  var qrydt = "delete from inventory where inventoryid='"+req.params.inventoryid+"'";
connection.query(qrydt,function(error,results,fields){
  if(error)
  {

  }
  connection.query("select * from inventory",function(error,results,fields)
  {
    if(error){
  
    }
    else
    {
      res.render('addinventory',{user:req.user,
        account:results,
        success_msg:'You Are Successfully  Delete Inventory Info!'
      })
    }
  })
})
  });
  router.post('/deleteuser/(:userid)',ensureAuthenticated,async function(req,res){
 
    var qrydt = "delete  from users where userid='"+req.params.userid+"'";
  connection.query(qrydt,function(error,results,fields){
    if(error)
    {
  
    }
    connection.query("select * from users",function(error,results,fields)
    {
      if(error){
    
      }
      else
      {
        res.render('adduser',{user:req.user,
          account:results,
          success_msg:'You Are Successfully  Delete User Info!'
        })
      }
    })
  })
    });
    router.get('/editcustomer/(:customerid)',ensureAuthenticated,async function(req,res){
      connection.query("select * from customer",function(error,results,fields)
      {
        if(error){
      
        }
        else
        {
          res.render('editcustomer',{user:req.user,
            account:results,
            updatedid:req.params.customerid
          })
        }
      })
    
    });
    router.get('/editaccount/(:accountid)',ensureAuthenticated,async function(req,res){
      connection.query("select * from account",function(error,results,fields)
      {
        if(error){
      
        }
        else
        {
          res.render('editaccount',{user:req.user,
            account:results,
            updatedid:req.params.accountid
          })
        }
      })
    
    });
    router.get('/editinventory/(:inventoryid)',ensureAuthenticated,async function(req,res){
      connection.query("select * from inventory",function(error,results,fields)
      {
        if(error){
      
        }
        else
        {
          res.render('editinventory',{user:req.user,
            account:results,
            updatedid:req.params.inventoryid
          })
        }
      })
      
      });
      router.get('/edituser/(:userid)',ensureAuthenticated,async function(req,res){
        connection.query("select * from users",function(error,results,fields)
        {
          if(error){
        
          }
          else
          {
            res.render('edituser',{user:req.user,
              account:results,
              updatedid:req.params.userid
            })
          }
        })
      
      });
  router.post('/editcustomer/(:customerid)',ensureAuthenticated,async function(req,res){

     const{intialbalance,customerphone} = req.body;
    var qdludt = "update customer set intialbalance= '"+intialbalance+"',customerphone='"+customerphone+"' where customerid ='"+req.params.customerid+"'";
    connection.query(qdludt,function(error,results,fields){
      if(error)
      {

      }
      connection.query("select * from customer",function(error,results,fields)
      {
        if(error){
      
        }
        else
        {
          res.render('editcustomer',{user:req.user,
            account:results,
            updatedid:req.params.customerid,
            success_msg:'You Are Successfully Updated Customer Info'
          })
        }
      })
    })
  
  
    
    });
    router.post('/editaccount/(:accountid)',ensureAuthenticated,async function(req,res){
      const{bankname,accountnumber,intialbalance} = req.body;
    var qdludt = "update account set intialbalance= '"+intialbalance+"',bankname= '"+bankname+"',accountnumber= '"+accountnumber+"' where accountid ='"+req.params.accountid+"'";
   
    connection.query(qdludt,function(error,results,fields){
      if(error)
      {

      }
      connection.query("select * from account",function(error,results,fields)
      {
        if(error){
      
        }
        else
        {
          res.render('editaccount',{user:req.user,
            account:results,
            updatedid:req.params.customerid,
            success_msg:'You Are Successfully Updated Account Info'
          })
        }
      })
    })

    });
    router.post('/editinventory/(:inventoryid)',ensureAuthenticated,async function(req,res){
      const{inventorymanager,contactphone,inventoryname} = req.body;
    var qdludt = "update inventory set inventoryname= '"+inventoryname+"' inventorymanager= '"+inventorymanager+"',contactphone= '"+contactphone+"' where inventoryid ='"+req.params.inventoryid+"'";
    connection.query(qdludt,function(error,results,fields){
      if(error)
      {

      }
      connection.query("select * from inventory",function(error,results,fields)
      {
        if(error){
      
        }
        else
        {
          res.render('editinventory',{user:req.user,
            account:results,
            updatedid:req.params.customerid,
            success_msg:'You Are Successfully Updated Inventory Info'
          })
        }
      })
    }) 
  
      
      });
      router.post('/edituser/(:userid)',ensureAuthenticated,async function(req,res){
        const{username,password} = req.body;
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(password, salt, (err, hash) => {
            if (err) throw err;
          var  newpassword = hash;
          var qdludt = "update users set username= '"+username+"',password= '"+newpassword+"' where userid ='"+req.params.userid+"'";
          connection.query(qdludt,function(error,results,fields){
            if(error)
            {
      
            } 
            connection.query("select * from users",function(error,results,fields)
            {
              if(error){
            
              }
              else
              {
                res.render('edituser',{user:req.user,
                  account:results,
                  updatedid:req.params.customerid,
                  success_msg:'You Are Successfully Updated User Info'
                })
              }
            })
  
          })
          });
        });
     
      });
      router.get('/data',async function(req,res)
      {
        connection.query("SELECT  distinct containernumber  FROM productlist",function(error,results,fields){
          if(error)
          {
console.log(error)
          }
          console.log(results)
        res.render('data',{user:req.user,
        
          containernumber:results
        })

        })

      })
      router.post('/deleteinventorydata',async function(req,res)
      {
        const{containerid} = req.body;
        connection.query("delete from productlist where containernumber='"+containerid+"'",function(error,results,Fields)
        {
          if(error)
          {
console.log(error)
          }
          connection.query("SELECT  distinct containernumber  FROM productlist",function(error,results,fields){
            if(error)
            {
  console.log(error)
            }
            console.log(results)
          res.render('data',{user:req.user,
          
            containernumber:results
          })
  
          })
        })
       
      })
module.exports = router;