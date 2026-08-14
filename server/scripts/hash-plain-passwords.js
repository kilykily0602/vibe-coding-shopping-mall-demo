const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const SALT_ROUNDS = 10;

async function migratePasswords() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = mongoose.connection.db.collection('users');
  const docs = await users.find({}).toArray();

  let updated = 0;
  let alreadyHashed = 0;

  for (const doc of docs) {
    const password = doc.password;
    if (typeof password !== 'string' || !password) continue;

    if (password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$')) {
      alreadyHashed += 1;
      continue;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await users.updateOne(
      { _id: doc._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );
    updated += 1;
  }

  console.log(`done: updated=${updated}, alreadyHashed=${alreadyHashed}, total=${docs.length}`);
  await mongoose.disconnect();
}

migratePasswords().catch((error) => {
  console.error(error);
  process.exit(1);
});
