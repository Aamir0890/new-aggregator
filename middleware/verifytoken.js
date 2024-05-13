const jwt=require('jsonwebtoken')
const fs=require('fs')
require('dotenv').config();
 const verifyToken=(req,res,next)=>{
    
    if(req.headers&&req.headers.authorization){
      const bearerToken = req.headers.authorization.split(' ')[1];
      
      jwt.verify(bearerToken,process.env.SECRET_KEY,function(err,decoded){
        if(err){
            req.user=undefined
            req.message="jwt undefined"
            next()
        }else{
          fs.readFile('./user.json','utf-8',(err,data)=>{
            if(err){
             
                req.user=undefined
                req.message="Somthing went wrong while fetching the info"
                next()
            }else{
                const userData=JSON.parse(data)
                const user=userData.users.find(user=>user.id=decoded.id)
                if(user){
                        req.user=user;
                        req.message="User found successfully"
                       next()
                }else{
                    req.user=undefined
                    req.message="User not found"
                    next()
                }
            }
          })
        }
      })
    }else{
        req.user=undefined
        req.message="Authorization header not found"
        next()
    }
 }

 module.exports=verifyToken