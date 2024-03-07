var express = require('express');
var router = express.Router();


const Player = require('../models/Player')
const Tag = require('../models/Tag')
const Video = require('../models/Video')


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/latest/:nbOfFetch', function (req, res, next) {
  let filters = [];

  // The $all operator selects the documents where the value of a field is an array that contains all the specified elements.
  if (req.body.tags.length > 0) {
    filters.push({ 'tags': { $all: req.body.tags } });
  }
  
  if (req.body.players.length > 0) {
    filters.push({ 'players': { $all: req.body.players } });
  }
  
  let query = {};
  if (filters.length > 0) {
    query = { $and: filters };
  }
  
  Video.find(query).sort('-date').skip(req.params.nbOfFetch * 6).limit(7).populate("players").populate("tags").then(videos => {
    console.log(videos)
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
    if (!req.body) {
      return res.status(400).send('No files were uploaded.');
    }



    // Extraction des joueurs et des tags à partir de req.body
    const players = [];
    const tags = [];
    for (const key in req.body) {
      if (key.startsWith('player_')) {
        players.push(key.slice(7))
      } else if (key.startsWith('tag_')) {
        tags.push(key.slice(4))
      }
    }


    // Création d'un nouveau document vidéo dans votre base de données
    const newVideo = new Video({
      src: req.body.imgUrl,
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
