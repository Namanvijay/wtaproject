var express = require('express')
var mongojs = require('mongojs')
var JSAlert = require("js-alert");
var shortid = require('shortid');
var md5=require('md5');
var nodemailer = require('nodemailer');
const validatePhoneNumber = require('validate-phone-number-node-js');
var validator = require("email-validator");
var bodyparser=require('body-parser');

var db = mongojs('mongodb://localhost:27017/mydb', ['sample1','orders','issues','feeds','admin'])

var app = express()
app.use(express.static('public'))
app.use(bodyparser.urlencoded({extended:true}));
app.set('view engine','ejs')
app.use('/images',express.static('views/images'))


app.get('/',function(req,res){
	res.sendFile('index.html')
})

app.get('/login',function(req,res){
	res.render('login')
})

app.get('/signup',function(req,res){
	res.render('signup')
})

app.get('/loginsubmit',function(req,res){
	var prodata = {
		rno : req.query.rno,
		pwd : md5(req.query.pwd)
	}
	let rno=req.query.rno;
	let pwd=req.query.pwd;
	let errors=[]
	db.sample1.find(prodata, function(err,dat){
		if(dat.length>0){
			if(req.query.rno == 'admin' && req.query.pwd == '12345678'){
				var odata
				var idata
				db.orders.find({}, function(err,dat){
					if(err){
						console.log(err)
					}
					else{
						odata = dat
						db.issues.find({}, function(err,dat){
							if(err){
								console.log(err)
							}
							else{
								idata = dat
								res.render('admin',{ person : req.query.rno , orders : odata , issues : idata}) 
							}
						})
					}
				})
			}
			else{
				res.redirect('profiles/'+req.query.rno)
			}
		}
		else{
			console.log('profile does not exit or pwd incorrect!!')
			errors.push({msg:"Password or roll no do not match"});
			res.render("login",{errors});
			
		}
	})
})

app.get('/signupsubmit',function(req,res){
	var prodata = {
		uid : req.query.uid,
		pwd : md5(req.query.pwd),
		email : req.query.email,
		phno : req.query.phno,
		rno : req.query.rno
	}
	let pwd=req.query.pwd;
	let email=req.query.email;
	let phno=req.query.phno;
	let rno=req.query.rno;
	let name=req.query.uid;
	var flg;
	var regExp = /^(\([0-9]{3}\) |[0-9]{3}-)[0-9]{3}-[0-9]{4}/;
	var phone = phno.match(regExp);
	

	
	
 


	let errors=[];
	if(!pwd || !email || !phno || !rno || !name)
	
	errors.push({msg:"Fill all the credentials"});
	if(errors.length)
	{
		res.render('signup',{errors});
	}

	else
	{
		if(validator.validate(email))
		flg=0;
		else
		flg=1;
		
		
	
	var cpwd = md5(req.query.cpwd)
	if(cpwd!=md5(pwd))
	{
		errors.push({msg:"Password and confirm password are not matching"});
	}
	if(pwd.length<6)
	{
		errors.push({msg:"Password length should be atlest of 6 length"})
	}
	if(phno.length!=10)
	errors.push({msg:"Invalid phone no"});

	if(flg==1)
	errors.push({msg:"Invalid email address"});

	if(errors.length)
	{
		res.render('signup',{errors});
	}
	else
	{
		var rollno=
		{
			rno : req.query.rno
		}
		db.sample1.find(rollno,function(err,user)
		{
			if(user.length>0)
			{
				errors.push({msg:"Roll no already taken"})
				res.render('signup',{errors});

			}
			else
			{
				var emails=
				{
					email : req.query.email,

				}
			 db.sample1.find(emails,function(err,user)
			 {
				 if(user.length>0)
				 {
					errors.push({msg:"Email already taken"})
					res.render('signup',{errors});

				 }
				 else
				 {
					if(prodata.pwd == cpwd && prodata.pwd!=""){
						db.sample1.find(prodata, function(err,dat){
							if(dat.length>0){
								console.log('profile already found')
								errors.push({msg:"Profile already exist!!"})
								res.render("signup",{errors});
								
							}
							else{
								var transporter = nodemailer.createTransport({
								service: 'gmail',
								auth: {
								  user: 'namanvj14@gmail.com',
								  pass: 'naman1411'
								}
							  });
							  
							  var mailOptions = {
								from: 'namanvj14@gmail.com',
								to: email,
								subject: 'NITK-LMS registration',
								html: `<p>Hello ${name} roll no ${rno}... You are succesfully registered for NITK-LMS </p>`
							  };
							  
							  transporter.sendMail(mailOptions, function(error, info){
								if (error) {
								  console.log(error);
								} else {
								  console.log('Email sent: ' + info.response);
								}
							  });
								
								db.sample1.insert(prodata,function(err,data){
									if (err) {
										console.log(err)
									}
									else{
										console.log('inserted succesfully')
										res.render('login')
									}
								})	
							}
						})
					}

				 }
			 })
				
			

			}
			
		})

		

	}
	
	
	

	}
	
	
	
})

app.get('/profiles/:code',function(req,res){
	var a = req.params.code
	order = {
		id : a,
	}
	var odata
	var idata
	db.orders.find(order, function(err,dat){
		if(err){
			console.log(err)
		}
		else{
			odata = dat
			db.issues.find(order, function(err,dat){
				if(err){
					console.log(err)
				}
				else{
					idata = dat
					res.render('profiles',{ person : a , orders : odata , issues : idata}) 
				}
			})
		}
	})
})

app.get('/profiles/:code/neworder',function(req,res){
	res.render('neworder',{person : req.params.code})
})

app.get('/profiles/:code/newissue',function(req,res){
	var a = req.params.code
	order = {
		id : a,
	}
	var odata
	db.orders.find(order, function(err,dat){
		if(err){
			console.log(err)
		}
		else{
			odata = dat
			res.render('newissue',{person : req.params.code , orders:odata})
		}
	})
	
})

app.get('/newissuesubmit', function(req, res){
	var datetime = new Date();
    var datet = datetime.toISOString().slice(0,10)
    var uid = req.query.udig
    if(uid == null){
    	uid = ""
    }
	var issue = {
		id : req.query.id,
		uid : uid,
		comment : req.query.comment,
		date : datet,
		status : "pending"
	}
	db.issues.insert(issue,function(err,data){
		if (err) {
			console.log(err)
		}
		else{
			console.log('inserted succesfully')
			res.redirect('/profiles/'+req.query.id)
		}
	})
})

app.get('/newordersubmit',function(req,res){
	var wp = {
		shirts : 10,
		pants : 15,
		jeans : 20,
		shorts : 15,
		towels : 6,
		mundu : 10,
		bsheets : 15,
		pillowc : 5,
	}
	var ip = {
		shirts : 10,
		pants : 15,
		jeans : 15,
		shorts : 10,
		towels : 0,
		mundu : 10,
		bsheets : 7,
		pillowc : 0,
	}
	var tamount

	var wamount = (wp.shirts*req.query.shirts + wp.pants*req.query.pants + wp.jeans*req.query.jeans + wp.shorts*req.query.shorts + 
	wp.towels*req.query.towel + wp.mundu*req.query.mundu + wp.bsheets*req.query.bsheet + wp.pillowc*req.query.pillow)
	var iamount = (ip.shirts*req.query.shirts + ip.pants*req.query.pants + ip.jeans*req.query.jeans + ip.shorts*req.query.shorts + 
	ip.towels*req.query.towel + ip.mundu*req.query.mundu + ip.bsheets*req.query.bsheet + ip.pillowc*req.query.pillow) 
	
	if(req.query.wash == "on" && req.query.iron == "on"){
		tamount = wamount+iamount
	}
	else if(req.query.wash == "on" && req.query.iron != "on"){
		tamount = wamount
	}
	else if(req.query.wash != "on" && req.query.iron == "on"){
		tamount = iamount
	}
	var unid = shortid.generate()

    var datetime = new Date();
    var datet = datetime.toISOString().slice(0,10)

	var order = {
		date : datet,
		uid : unid,
		id : req.query.id,
		sem : req.query.sem,
		hostel : req.query.hostel,
		room: req.query.room,
		shirts : req.query.shirts,
		pants : req.query.pants,
		jeans : req.query.jeans,
		shorts : req.query.shorts,
		towels : req.query.towel,
		mundu : req.query.mundu,
		bsheets : req.query.bsheet,
		pillowc : req.query.pillow,
		wash :  req.query.wash,
		iron : req.query.iron,
		amount : tamount,
		status : "pending"
	}
	
		let id = req.query.id
		let sem = req.query.sem
		let	hostel = req.query.hostel
		let room= req.query.room
		let shirts = req.query.shirts
		let pants = req.query.pants
		let jeans = req.query.jeans
		let shorts = req.query.shorts
		let towels = req.query.towel
		let mundu = req.query.mundu
		let bsheets = req.query.bsheet
		let pillowc= req.query.pillow
		let wash = req.query.wash
		let iron = req.query.iron
		let errors=[];
		
	console.log(order)
// 	var result = ""
// db.collection("sample1").find({rno:id}).then(response => result =response )
	
	
	
	
		
		
	
	// var transporter = nodemailer.createTransport({
	// 	service: 'gmail',
	// 	auth: {
	// 	  user: 'namanvj14@gmail.com',
	// 	  pass: 'naman1411'
	// 	}
	//   });
	  
	//   var mailOptions = {
	// 	from: 'namanvj14@gmail.com',
	// 	to: result.email,
	// 	subject: 'NITK-LMS registration',
	// 	html: `<p>Hello ${result.uid} roll no ${id}. Thanks for booking order on NITK-LMS.Your uid is ${unid} and total amount is ${tamount} .This will get verified by admin within 2hrs.Check dashboard for more details.</p>`
	//   };
	  
	//   transporter.sendMail(mailOptions, function(error, info){
	// 	if (error) {
	// 	  console.log(error);
	// 	} else {
	// 	  console.log('Email sent: ' + info.response);
	// 	}
	//   });


	db.orders.insert(order,function(err,data){
		if (err) {
			console.log(err)
		}
		else{
			console.log('inserted succesfully')
			res.redirect('/profiles/'+req.query.id)
		}
	})
})
app.get("/feedback",function(req,res)
{
	res.render("feedback");
})
app.post("/feedback",function(req,res)
{
	var feed={
		name:req.body.name,
		email:req.body.email,
		comments:req.body.comments,
		experience:req.body.experience
	}
	console.log(feed);
	db.feeds.insert(feed,function(err,data){
		if (err) {
			console.log(err)
		}
		else{
			console.log('inserted succesfully')
			res.redirect('/');
		}
	})	


	
})

app.get('/profiles/admin/updateorder',function(req, res){
	var odata
	var idata
	db.orders.find({}, function(err,dat){
		if(err){
			console.log(err)
		}
		else{
			odata = dat
			db.issues.find({}, function(err,dat){
				if(err){
					console.log(err)
				}
				else{
					idata = dat
					res.render('updateorder',{ person : "admin", orders : odata , issues : idata}) 
				}
			})
		}
	})
}) 

app.get('/profiles/admin/updateissue',function(req, res){
	var odata
	var idata
	db.orders.find({}, function(err,dat){
		if(err){
			console.log(err)
		}
		else{
			odata = dat
			db.issues.find({}, function(err,dat){
				if(err){
					console.log(err)
				}
				else{
					idata = dat
					res.render('updateissue',{ person : "admin", orders : odata , issues : idata}) 
				}
			})
		}
	})
}) 

app.get('/updateordersubmit',function(req,res){
	var upid = req.query.udig
	var nstatus = req.query.stat

	db.orders.findAndModify({
	    query: { uid: upid },
	    update: { $set: { status: nstatus } },
	    new: true
	}, function (err, doc, lastErrorObject) {
	})
	db.orders.find({}, function(err,dat){
		if(err){
			console.log(err)
		}
		else{
			odata = dat
			db.issues.find({}, function(err,dat){
				if(err){
					console.log(err)
				}
				else{
					idata = dat
					res.render('admin',{ person : 'admin' , orders : odata , issues : idata}) 
				}
			})
		}
	})
})

app.get('/updateissuesubmit',function(req,res){
	var upid = req.query.udig
	var nstatus = req.query.stat

	db.issues.findAndModify({
	    query: { uid: upid },
	    update: { $set: { status: nstatus } },
	    new: true
	}, function (err, doc, lastErrorObject) {
	})
	db.orders.find({}, function(err,dat){
		if(err){
			console.log(err)
		}
		else{
			odata = dat
			db.issues.find({}, function(err,dat){
				if(err){
					console.log(err)
				}
				else{
					idata = dat
					res.render('admin',{ person : 'admin' , orders : odata , issues : idata}) 
				}
			})
		}
	})
})

app.listen(7000, function(){
	console.log("server started.")
})
