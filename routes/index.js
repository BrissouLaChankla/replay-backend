var express = require('express');
var router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs')

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'tmp/'); // Chemin du dossier où les fichiers seront stockés
  },
  filename: function (req, file, cb) {
    // Génère le nom de fichier final avec l'extension originale
    cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ storage: storage });

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

router.post('/store', upload.single('uploaded_file'), async function (req, res) {
  const { path } = req.file

  const players = [];
  const tags = [];

  for (const key in req.body) {
    if (key.includes('player_')) {
      players.push(key.slice(7))
    } else if (key.includes('tag_')) {
      tags.push(key.slice(4))
    }
  }

  cloudinary.uploader.upload(path, {
    resource_type: "video",
  },
    async function (error, result) {
      if (error) {
        console.log(error)
        return res.status(500).send("Erreur lors du téléchargement du fichier : " + error.message);
      }

      const newVideo = await new Video({
        src: result.url,
        date: new Date(),
        title: req.body.title,
        tags,
        players
      })

      const newVid = await newVideo.save();

      res.json({ newVid })

    })


});

module.exports = router;
