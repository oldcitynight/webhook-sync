const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');

let PathExists = fs.existsSync('./repo');

const Repo = 'https://github.com/oldcitynight/docs.git';

const cmdCallback = (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
};

const InitRepo = () => {
    console.log('Cloning target repo...');
    execSync(`git clone ${Repo} repo`, cmdCallback);
    console.log('Setting up repo...');
    execSync('cd repo && git remote rename origin target', cmdCallback);
    execSync(`cd repo && git remote rename upstream source`, cmdCallback);
    return syncRepo();
}

const syncRepo = () => {
    console.log('Syncing repo...');
    execSync('cd repo && git pull source main', cmdCallback);
    const status = execSync('cd repo && git status --porcelain').toString().trim();
    if (!status) {
        console.log('No changes found. Aborting...');
        return true;
    };
    execSync('cd repo && git add .', cmdCallback)
    execSync(`cd repo && git commit -m "Merge branch 'yunzai-org:main' into main"`, cmdCallback);
    console.log('Pushing repo...');
    execSync('cd repo && git push target main', cmdCallback);
    return true;
};

const app = express();
app.use(express.json());
app.post('/', (req, res) => {
    console.log('New webhook event: ', req.body);
    if (req.body.ref === 'refs/heads/main') syncRepo();
    res.status(200).send('Success');
});

if (!PathExists) {
    InitRepo();
    PathExists = true;
}

app.listen(10800, '0.0.0.0')
