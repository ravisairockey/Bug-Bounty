const { Octokit } = require("@octokit/rest");

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { name, approach } = req.body;

    if (!name || !approach) {
        return res.status(400).json({ message: 'Name and approach are required' });
    }

    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
    });

    const owner = 'ravisairockey';
    const repo = 'Bug-Bounty';
    const path = 'reviews.json';

    try {
        // Get the current reviews.json file
        const { data: fileData } = await octokit.repos.getContent({
            owner,
            repo,
            path,
        });

        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        const reviews = JSON.parse(content);

        // Add the new review
        reviews.unshift({ name, approach, date: new Date().toISOString() });

        // Update the reviews.json file
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: `Add new review from ${name}`,
            content: Buffer.from(JSON.stringify(reviews, null, 2)).toString('base64'),
            sha: fileData.sha,
        });

        res.status(200).json({ message: 'Review added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding review' });
    }
};
