var express = require('express');
var router = express.Router();
var models = require("../models");

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.send(401, 'Unauthorized');
};

/* GET ideas listing. */
router.get('/', function(req, res) {
  models.Community.findAll({
      include: [ models.Image ]
  }).then(function(communities) {
    res.send(communities);
  });
});

router.get('/:id', function(req, res) {
  models.Community.find({
    where: { id: req.params.id },
    include: [
      { model: models.Group,
        order: 'Group.created_at DESC'
      },
      {
        model: models.Image, as: 'CommunityLogoImages'
      },
      {
        model: models.Image, as: 'CommunityHeaderImages'
      }
    ]
  }).then(function(community) {
    res.send(community);
  });
});

router.post('/', isAuthenticated, function(req, res) {
  var community = models.Community.build({
    name: req.body.name,
    description: req.body.description,
    access: models.Community.convertAccessFromRadioButtons(req.body),
    domain_id: req.ypDomain.id,
    user_id: req.user.id,
    website: req.body.website
  });
  community.save().then(function() {
    if (req.body.uploadedLogoImageId) {
      models.Image.find({
        where: { id: req.body.uploadedLogoImageId }
      }).then(function(image) {
        if (image)
          community.addCommunityLogoImage(image);
        if (req.body.uploadedHeaderImageId) {
          models.Image.find({
            where: { id: req.body.uploadedHeaderImageId }
          }).then(function(image) {
            if (image)
              community.addCommunityHeaderImage(image);
              res.send(community);
          });
        } else {
          res.send(community);
        }
      });
    } else {
      res.send(community);
    }
     // Automatically add user to community
  }).catch(function(error) {
    res.sendStatus(403);
  });
});

module.exports = router;
