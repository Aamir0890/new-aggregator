const express = require('express');
const app = express();
const port = 3000;
const fs=require('fs')
const user=require('./user.json')
const bcrypt=require('bcrypt')
const verifyToken=require('./middleware/verifytoken')
require('dotenv').config();
const jwt=require('jsonwebtoken');
const { default: axios } = require('axios');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cron = require('node-cron');
const NodeCache = require('node-cache');
const z=require('zod')


const requestBodySchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(4, 'Password must be at least 8 characters long')
      .max(100, 'Password must be at most 100 characters long')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&()])[A-Za-z\d@$!%*?&()]+$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      }),
    name: z
      .string()
      .min(3, 'Username must be at least 3 characters long')
      .max(20, 'Username must be at most 20 characters long'),
    preferences: z.array(z.string()),
  });



app.post('/users/signup',(req,res)=>{
    try{
        const validatedBody = requestBodySchema.parse(req.body);
        let data=req.body;
           
          fs.readFile('./user.json','utf-8',(err,readdata)=>{
              if(err){
                return res.status(500).json("InternaL Server error")
              }else{
                const userData=JSON.parse(readdata);
                const usersWithEmail = userData.users.find(user=>user.email===data.email)
                if(usersWithEmail){
                    res.status(400).json("email already exist");
                }else{
                    const id=userData.users.length+1;
                    data.id=id;
                    const bpass=bcrypt.hashSync(data.password,8)
                   
                    data.password=bpass;
                    userData.users.push(data)
                    fs.writeFile('./user.json',JSON.stringify(userData),{encoding:'utf-8',flag:'w'},(err,data)=>{
                        if(err){
                            res.status(500).json("Internal Severe error")
                        }else{
                            res.status(200).json("user Created successfully")
                        }
                    })
                }
                
              }
          })

   
    }catch(err){
        if (err instanceof z.ZodError) {
            // Handle validation errors
            res.status(400).json({ errors: err.issues });
          } else {
            // Handle other errors
            res.status(500).json({ error: 'Internal server error' });
          }
    }
   
})

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(4, 'Password must be at least 8 characters long')
      .max(100, 'Password must be at most 100 characters long')
     
    })

app.post('/users/login',(req,res)=>{
          try{
            let data=req.body;
            const validatedBody = loginSchema.parse(req.body);
                fs.readFile('./user.json','utf-8',(err,readdata)=>{
                    if(err){
                        res.status(500).json("Internal Server error")
                    }else{
                        const userData=JSON.parse(readdata);
                        const usersWithEmail = userData.users.find(user=>user.email===data.email)
                        if(usersWithEmail===undefined){
                            return res.status(404).json("User not found")
                        }else{ 
                             console.log(bcrypt.compareSync(data.password,usersWithEmail.password),data.password,usersWithEmail.password)
                               if(bcrypt.compareSync(data.password,usersWithEmail.password)){
                                const token=jwt.sign({id:usersWithEmail.id},process.env.SECRET_KEY, { expiresIn: '1h' })
                                res.status(200).json({token:`${token}`})
                               }else{
                                res.status(401).json("password didn't match")
                               }
                        }
                    }
                })

          }catch(err){
            if (err instanceof z.ZodError) {
                // Handle validation errors
                res.status(400).json({ errors: err.issues });
              } else {
                // Handle other errors
                res.status(500).json({ error: 'Internal server error' });
              }
          }
       
})

app.get('/users/preferences',verifyToken,(req,res)=>{
      if(req.user){
        let preferences=req.user.preferences
              res.status(200).json({preferences})
      }else{
        return res.status(401).json({
            message:req.message
        })
      }
})


app.put('/users/preferences',verifyToken,(req,res)=>{
    if(req.user){
         fs.readFile('./user.json','utf-8',(err,data)=>{
if(err){
res.status(500).json("Internal Server error")
}else{
    const userData=JSON.parse(data);
    const userIndex = userData.users.findIndex(user => user.email === req.user.email);
    userData.users[userIndex].preferences=req.body.preferences;
    fs.writeFile('./user.json',JSON.stringify(userData),{encoding:'utf-8',flag:'w'},(err,data)=>{
        if(err){
            res.status(500).json("Internal Severe error")
        }else{
            res.status(200).json("preference updated successfully")
        }
    })
}
         })
    }else{
        return res.status(403).json({
            message:req.message
        })
    }
})
const cache = new NodeCache({ stdTTL: 3600 });


async function Update(){
    console.log('ho')
    fs.readFile('./user.json','utf-8',(err,readdata)=>{
        if(err){
            res.status(500).json("Internal Server error")
        }else{
            const userData=JSON.parse(readdata);
            for(let i=0;i<userData.users.length;i++){
                   let data= []
                   data= apicall(userData.users[i]);
                   const cacheKey = `news:${userData.users[i].id}`;
                   const cachedNews = cache.get(cacheKey);
                   cache.set(cacheKey, cachedNews);
            }
        }
    })
}

cron.schedule('0 * * * *', Update);

async function apicall(user){
    let data=[]
    let idCounter = 1;
    for(let i=0;i<user.preferences.length;i++){
     const link=`${process.env.LINK}${[user.preferences[i]]}${process.env.COMPLETE}`
     // console.log(link)
     const result=await axios.get(link)
     const articlesWithId = result.data.articles.map(article => ({ ...article, id: idCounter++,favourite:0,read:0 }));
     
     data = [...data, ...articlesWithId];
    }
    return data;
}

app.get('/news',verifyToken,async(req,res)=>{
    if(req.user){
        const cacheKey = `news:${req.user.id}`;
        const cachedNews = cache.get(cacheKey);
        if(cachedNews){
            // console.log('api called')
            // console.log(cachedNews)
            res.status(200).json({news:cachedNews})}
        else{
            let data=[]
            
            data=await apicall(req.user)
            if(data.length!=0){
                cache.set(cacheKey, data);
                // console.log(data)
             res.status(200).json({news:data})
            }else{
             res.status(400).json("Api erro")
            }
        }
        
           
    }else{
        return res.status(401).json({
            message:req.message
        })
    }
    
})

app.post('/news/:id/read',verifyToken,(req,res)=>{
if(req.user){
    const cacheKey = `news:${req.user.id}`;
    const cachedNews = cache.get(cacheKey); 
    
    if(cachedNews){
          let id=req.params.id;
         
          const articlesWithId = cachedNews.find(article => article.id===parseInt(id));
          if(articlesWithId!==undefined){
           
            articlesWithId.read=1;
            cache.set(cacheKey, cachedNews);
            res.status(200).json(`Article with id ${id} has been updated`)
          }else{
            res.status(404).json("Article not found")
          }
         
    }else{
        res.status(404).json("please get news first")
    }
}else{
    res.status(400).json("Please signIn")
}
})

app.post('/news/:id/favourite',verifyToken,(req,res)=>{
    if(req.user){
        const cacheKey = `news:${req.user.id}`;
        const cachedNews = cache.get(cacheKey); 
        
        if(cachedNews){
              let id=req.params.id;
              const articlesWithId = cachedNews.find(article => article.id===parseInt(id));
              if(articlesWithId!==undefined){
                articlesWithId.favourite=1;
                cache.set(cacheKey, cachedNews);
                res.status(200).json(`Article with id ${id} has been updated to favourite`)
              }else{
                res.status(404).json("Article not found")
              }
             
        }else{
            res.status(404).json("please get news first")
        }
    }else{
        res.status(400).json("Please signIn")
    }
    })

    app.get('/news/read',verifyToken,(req,res)=>{
        if(req.user){
            const cacheKey = `news:${req.user.id}`;
            const cachedNews = cache.get(cacheKey); 
            if(cachedNews){
                 let news=cachedNews.filter(news=> news.read===1);
                 if(news){
                    res.status(200).json(news);
                 }else{
                    res.status(400).json("No news found")
                 }
            }else{
                res.status(404).json("Please get the news first")
            }
        }else{
            res.status(400).json("Please sign In")
        }
    })
    
    app.get('/news/favourite',verifyToken,(req,res)=>{
        if(req.user){
            const cacheKey = `news:${req.user.id}`;
            const cachedNews = cache.get(cacheKey); 
            if(cachedNews){
                 let news=cachedNews.filter(news=> news.favourite===1);
                 if(news){
                    res.status(200).json(news);
                 }else{
                    res.status(400).json("No news found")
                 }
            }else{
                res.status(404).json("Please get the news first")
            }
        }else{
            res.status(400).json("Please sign In")
        }
    })
    app.get('/news/search/:keyword',verifyToken, (req, res) => {
        if(req.user){
            const cacheKey = `news:${req.user.id}`;
            const cachedNews = cache.get(cacheKey); 
              if(cachedNews){
                const keyword = req.params.keyword.toLowerCase();
                const searchResults = cachedNews.filter(article =>
                  article.title.toLowerCase().includes(keyword) ||
                  article.content.toLowerCase().includes(keyword)
                );
              
                if (searchResults.length > 0) {
                  res.status(200).json(searchResults);
                } else {
                  res.status(404).json({ error: 'No articles found for the given keyword' });
                }
              }else{
                res.status(404).json("Please get the news first")
              }
        }else{
            res.status(400).json("Please sign In")          
        }
       
      });
      
app.listen(port, (err) => {
    if (err) {
        return console.log('Something bad happened', err);
    }
    console.log(`Server is listening on ${port}`);
});



module.exports = app;


// Set up a basic Node.js project with Express.js and other necessary NPM packages.

// Implement user registration and login using bcrypt and JWT for password hashing and token-based authentication.

// Create an in-memory data store (e.g., an array) to store user information and their news preferences.

// Implement a RESTful API with the following endpoints:

// POST /register: Register a new user.

// POST /login: Log in a user.

// GET /preferences: Retrieve the news preferences for the logged-in user.

// PUT /preferences: Update the news preferences for the logged-in user.

// GET /news: Fetch news articles based on the logged-in user's preferences.

// Use external news APIs to fetch news articles from multiple sources. Incorporate async/await and Promises in the process of fetching news data and filtering it based on user preferences.

// Implement proper error handling for invalid requests, authentication errors, and authorization errors.

// Add input validation for user registration and news preference updates.

// Test the API using Postman or Curl to ensure it works as expected.

// Optional extension:

// Implement a caching mechanism to store news articles and reduce the number of calls to external news APIs. Use async/await and Promises to handle cache updates and retrievals.

// Allow users to mark articles as "read" or "favorite". Implement endpoints to:

// POST /news/:id/read: Mark a news article as read.

// POST /news/:id/favorite: Mark a news article as a favorite.

// GET /news/read: Retrieve all read news articles.

// GET /news/favorites: Retrieve all favorite news articles.

// Implement an endpoint to search for news articles based on keywords: GET /news/search/:keyword.

// Implement a mechanism to periodically update the cached news articles in the background, simulating a real-time news aggregator.
