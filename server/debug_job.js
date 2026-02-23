require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Job = require('./src/models/Job');
    const titles = [
        'Junior Artist Manager / Influencer Manager (m/w/d)',
        'Trainee Artist Manager / Influencer Manager (m/w/d)',
        "Trainee (m/w/d) Founder's Office - flexibel / hybrid - nächste Generation von AI Tools",
        'Consultant IT-Management I Vollzeit'
    ];
    const jobs = await Job.find({ title: { $in: titles } }).select('title postedDate createdAt approvedAt');
    console.log(JSON.stringify(jobs, null, 2));
    process.exit();
}).catch(console.error);
