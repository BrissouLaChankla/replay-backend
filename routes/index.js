const fs = require('fs');
const path = require('path');
var express = require('express');
var router = express.Router();
const cloudinary = require('cloudinary').v2;


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});


const Player = require('../models/Player')
const Tag = require('../models/Tag')
const Video = require('../models/Video')


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/latest/:nbOfFetch', function (req, res, next) {
  Video.find({}).sort('-date').skip(req.params.nbOfFetch * 6).limit(7).populate("players").populate("tags").then(videos => {
    if (videos.length < 7) {
      res.json({ videos: videos.slice(0, 6), lastFetch: true })
    } else {
      res.json({ videos: videos.slice(0, 6), lastFetch: false })
    }
  })

});

router.post('/filter', function (req, res, next) {

});

router.get('/playerNTags', async (req, res) => {
  try {

    const [players, tags] = await Promise.all([
      Player.find({}),
      Tag.find({})
    ]);

    res.json({ players, tags });
  } catch (error) {

    res.status(500).send(error.message);

  }
});

router.post('/store', async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    const uploadedFile = req.files.uploaded_file;
    const tempDir = '/tmp'; // Utilisation du répertoire temporaire
    const tempFilePath = path.join(tempDir, uploadedFile.name);

    // Déplace le fichier téléchargé vers le répertoire temporaire
    await uploadedFile.mv(tempFilePath);

    // Extraction des joueurs et des tags à partir de req.body
    const players = [];
    const tags = [];
    for (const key in req.body) {
      if (key.startsWith('player_')) {
        players.push(req.body[key]);
      } else if (key.startsWith('tag_')) {
        tags.push(req.body[key]);
      }
    }

    // Upload le fichier vers Cloudinary
    const resultCloudinary = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: "video",
    });

    // Suppression du fichier temporaire après l'upload
    fs.unlinkSync(tempFilePath);

    // Création d'un nouveau document vidéo dans votre base de données
    const newVideo = new Video({
      src: resultCloudinary.secure_url,
      date: new Date(),
      title: req.body.title,
      tags,
      players,
    });

    const newVid = await newVideo.save();

    // Réponse avec le nouveau document vidéo
    res.json({ newVid });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing your request.');
  }
});


module.exports = router;
