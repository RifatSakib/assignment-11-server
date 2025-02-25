require('dotenv').config();
const express = require('express');
// https://expressjs.com/en/starter/basic-routing.html

const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 7000;





// --------
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4fyu693.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        //   await client.connect();
        // Send a ping to confirm a successful connection
        //   await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");



        const userCollection = client.db("TutorHive").collection("users");
        const tutorialsCollection = client.db("TutorHive").collection("tutorials");
        const tutorCollection = client.db("TutorHive").collection("tutor");


        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '365d' });
            // console.log(token);
            res.send({ token });
        })

        // middlewares 
        const verifyToken = (req, res, next) => {
            // console.log('inside verify token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next();
            })
        }


        app.post('/users',verifyToken, async (req, res) => {
            const user = req.body;
            // insert email if user doesnt exists: 
            // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        // get all the users

        app.get('/users', verifyToken, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });
       
        app.post('/tutorials', verifyToken, async (req, res) => {
            const tutorial = req.body;
            const result = await tutorialsCollection.insertOne(tutorial);
            console.log(result);
            res.send(result);
        });

        // get all the users

        app.get('/tutorials', verifyToken, async (req, res) => {
            const result = await tutorialsCollection.find().toArray();
            res.send(result);
        });

        // app.get('/tutorials/:category',  async (req, res) => {
        //     const category = req.params.category;
        //     const result = await tutorialsCollection.find({language: category}).toArray();
        //      res.send(result);
        // });

        app.get('/tutorials/:category',  verifyToken,async (req, res) => {
            const category = req.params.category;
            try {
                const result = await tutorialsCollection.find({ language: category }).toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching tutorials by category:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        
        app.get('/tutorials/email/:email',  verifyToken,async (req, res) => {
            const email = req.params.email;
            try {
                const result = await tutorialsCollection.find({ email: email }).toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching tutorials by category:', error);
                res.status(500).send('Internal Server Error');
            }
        });
       

       

        app.post('/tutor', verifyToken, async (req, res) => {
            const tutor = req.body;
            const result = await tutorCollection.insertOne(tutor);
            console.log(result);
            res.send(result);
        });


        app.get('/tutor/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await tutorialsCollection.findOne(query);
            res.send(result);
        });




        app.get('/tutor', verifyToken, async (req, res) => {
            const result = await tutorCollection.find().toArray();
            res.send(result);
        });

        app.patch('/tutorials/review/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $inc: { review: 1 } 
            };
            const result = await tutorialsCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })



        app.delete('/tutorials/delete/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await tutorialsCollection.deleteOne(query);
            res.send(result);
        })

        app.get('/tutorials/update/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await tutorialsCollection.findOne(query);
            res.send(result);
        });


        app.put('/tutorials/update/:id', verifyToken,async (req, res) => {
            const id = req.params.id;

            // https://www.mongodb.com/docs/drivers/node/current/usage-examples/updateOne/

            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: req.body
            }

            const result = await tutorialsCollection.updateOne(filter, updatedDoc, options)
            console.log(result)
            res.send(result);
        })

    } finally {
        // Ensures that the client will close when you finish/error
        //   await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Yaaaa!,TutorHive ')
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})