import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URL!);
await client.connect();
const db = client.db();
const curators = await db.collection("referencephotobinning.curators").find({}, { projection: { _id: 0, admin: 1 } }).toArray();
const founding = await db.collection("referencephotobinning.founding").find({}, { projection: { _id: 1, admin: 1 } }).toArray();
const ids = [...new Set([...curators.map((item) => item.admin), ...founding.map((item) => item.admin)])];
const preview = await db.collection("registering.users").findOne({ username: "lucy-preview" }, { projection: { _id: 1 } });
if (!preview) throw new Error("preview account missing");
await db.collection("referencephotobinning.curators").updateOne({ admin: preview._id }, { $setOnInsert: { admin: preview._id } }, { upsert: true });
const names = await db.collection("registering.users").find({ _id: { $in: [...ids, preview._id] } }, { projection: { username: 1 } }).toArray();
console.log(JSON.stringify({ curators: await db.collection("referencephotobinning.curators").countDocuments(), users: names.map((user) => user.username) }));
await client.close();
