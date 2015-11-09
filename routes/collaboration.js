
///////////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////////
var collaboration = function (server, port) {

  var socketIo = require('socket.io').listen(port);
  var express = require('express');
  var request = require('request');
  var _ = require('lodash');

  var VIEWPORT_FILTER = {
    guid: false,
    seedURN: false,
    objectSet: false,
    viewport: true,
    renderOptions: false
  };

  var OBJECT_FILTER = {
    guid: false,
    seedURN: false,
    objectSet: true,
    viewport: false,
    renderOptions: false
  };

  var RENDER_FILTER = {
    guid: false,
    seedURN: false,
    objectSet: false,
    viewport: false,
    renderOptions: true
  };

  /////////////////////////////////////////////////////////////////////////////
  // Hashmap to keep running meetings
  //
  /////////////////////////////////////////////////////////////////////////////
  var meetingMap = {};

  /////////////////////////////////////////////////////////////////////////////
  // Creates new meeting
  //
  /////////////////////////////////////////////////////////////////////////////
  function createMeeting(
    meetingId,
    viewportState,
    objectState,
    renderState,
    urn,
    modelId,
    viewablePath) {

    var meeting = {
      viewportState: viewportState,
      objectState: objectState,
      renderState: renderState,
      viewablePath: viewablePath,
      meetingId: meetingId,
      modelId: modelId,
      chatHistory: [],
      users: {},
      urn: urn
    };

    meetingMap[meetingId] = meeting;

    return meeting;
  };

  /////////////////////////////////////////////////////////////////////////////
  // Adds new user to meeting
  //
  /////////////////////////////////////////////////////////////////////////////
  function addUser(meetingId, username, socket) {

    var user = {
      meetingId: meetingId,
      username: username,
      socket: socket
    }

    meetingMap[meetingId].users[socket.id] = user;

    return user;
  };

  /////////////////////////////////////////////////////////////////////////////
  // sends users state to all users
  //
  /////////////////////////////////////////////////////////////////////////////
  function emitUsersState(meeting) {

    for (var socketId in meeting.users) {

      var usersMsg = {
        meetingId: meeting.meetingId,
        users: _.map(meeting.users, 'username')
      };

      meeting.users[socketId].socket.emit(
        'Collaboration.Users',
        usersMsg);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Initialises collaboration
  //
  /////////////////////////////////////////////////////////////////////////////
  function initialise() {

    var io = socketIo.listen(server, {log: false});

    ///////////////////////////////////////////////////////////////////////////
    // New socket connection
    //
    ///////////////////////////////////////////////////////////////////////////
    io.sockets.on('connection', function (socket) {

      console.log('Incoming socket connection: ' + socket.id);

      /////////////////////////////////////////////////////////////////////////
      // NewMeeting message handler
      //
      /////////////////////////////////////////////////////////////////////////
      socket.on('Collaboration.NewMeeting', function (collaborationMsg) {

        console.log('New Meeting: ' + collaborationMsg.meetingId);

        var meeting = createMeeting(
          collaborationMsg.meetingId,
          collaborationMsg.viewportState,
          collaborationMsg.objectState,
          collaborationMsg.renderState,
          collaborationMsg.urn,
          collaborationMsg.modelId,
          collaborationMsg.viewablePath);

        var user = addUser(collaborationMsg.meetingId,
          collaborationMsg.username,
          socket);

        // update users state
        emitUsersState(meeting);
      });

      /////////////////////////////////////////////////////////////////////////
      // JoinMeeting message handler
      //
      /////////////////////////////////////////////////////////////////////////
      socket.on('Collaboration.JoinMeeting', function (collaborationMsg) {

        var meeting = meetingMap[collaborationMsg.meetingId];

        if(meeting) {

          // add new user to the meeting
          var user = addUser(collaborationMsg.meetingId,
            collaborationMsg.username,
            socket);

          // sends new user update to all users
          emitUsersState(meeting);

          // sends viewable path to load for new user
          var loadMsg = {
            meetingId: collaborationMsg.meetingId,
            viewablePath: meeting.viewablePath,
            urn: meeting.urn,
            modelId: meeting.modelId
          };

          user.socket.emit('Collaboration.LoadViewable',
            loadMsg);

          // sends chat history to new user only
          meeting.chatHistory.forEach(function(chatMsg) {

            user.socket.emit('Collaboration.ChatMessage',
              chatMsg);
          });
        }
      });

      /////////////////////////////////////////////////////////////////////////
      // ViewableChanged message handler
      //
      /////////////////////////////////////////////////////////////////////////
      socket.on('Collaboration.ViewableChanged', function (collaborationMsg) {

        var meeting = meetingMap[collaborationMsg.meetingId];

        if(meeting) {

          // stores new meeting viewable
          meeting.viewablePath = collaborationMsg.viewablePath;

          // dispatch message to all users
          // except user who sent the message
          for(var socketId in meeting.users) {

            if(socket.id !== socketId) {

              var user = meeting.users[socketId];

              user.socket.emit('Collaboration.LoadViewable',
                collaborationMsg);
            }
          }
        }
      });

      /////////////////////////////////////////////////////////////////////////
      // StateChanged message handler
      //
      /////////////////////////////////////////////////////////////////////////
      socket.on('Collaboration.StateChanged', function (collaborationMsg) {

        var meeting = meetingMap[collaborationMsg.meetingId];

        if(meeting) {

          // stores new meeting state
          switch(collaborationMsg.stateType) {

            case 'viewport':
              meeting.viewportState = collaborationMsg.state;
              break;

            case 'object':
              meeting.objectState = collaborationMsg.state;
              break;

            case 'render':
              meeting.renderState = collaborationMsg.state;
              break;
          }

          // dispatch message to all users
          // except user who sent the message
          for(var socketId in meeting.users) {

            if(socket.id !== socketId) {

              var user = meeting.users[socketId];

              user.socket.emit('Collaboration.StateChanged',
                collaborationMsg);
            }
          }
        }
      });

      /////////////////////////////////////////////////////////////////////////
      // ChatMessage message handler
      //
      /////////////////////////////////////////////////////////////////////////
      socket.on('Collaboration.ChatMessage', function (collaborationMsg) {

        var meeting = meetingMap[collaborationMsg.meetingId];

        if(meeting) {

          meeting.chatHistory.push(collaborationMsg);

          // dispatch chat message to all users
          for(var socketId in meeting.users) {

            var user = meeting.users[socketId];

            user.socket.emit('Collaboration.ChatMessage',
              collaborationMsg);
          }
        }
      });

      /////////////////////////////////////////////////////////////////////////
      // UI message handler
      //
      /////////////////////////////////////////////////////////////////////////
      socket.on('Collaboration.UIMessage', function (collaborationMsg) {

        var meeting = meetingMap[collaborationMsg.meetingId];

        if(meeting) {

          // dispatch message to all users
          // except user who sent the message
          for(var socketId in meeting.users) {

            if(socket.id !== socketId) {

              var user = meeting.users[socketId];

              user.socket.emit('Collaboration.UIMessage',
                collaborationMsg);
            }
          }
        }
      });

      /////////////////////////////////////////////////////////////////////////
      // ExtensionMessage message handler
      //
      /////////////////////////////////////////////////////////////////////////
      socket.on('Collaboration.ExtensionMessage', function (collaborationMsg) {

        var meeting = meetingMap[collaborationMsg.meetingId];

        if(meeting) {

          // dispatch message to all users
          // except user who sent the message
          for(var socketId in meeting.users) {

            if(socket.id !== socketId) {

              var user = meeting.users[socketId];

              user.socket.emit('Collaboration.ExtensionMessage',
                collaborationMsg);
            }
          }
        }
      });
    
      /////////////////////////////////////////////////////////////////////////
      // request state init handler
      //
      /////////////////////////////////////////////////////////////////////////
      socket.on('Collaboration.RequestStateInit', function (collaborationMsg) {

        var meeting = meetingMap[collaborationMsg.meetingId];

        if(meeting) {

          var viewportMsg = {
            meetingId: collaborationMsg.meetingId,
            state: meeting.viewportState,
            filter: VIEWPORT_FILTER
          };

          var objectsMsg = {
            meetingId: collaborationMsg.meetingId,
            state: meeting.objectState,
            filter: OBJECT_FILTER
          };

          var renderMsg = {
            meetingId: collaborationMsg.meetingId,
            state: meeting.viewportState,
            filter: RENDER_FILTER
          };

          var user = meeting.users[socket.id];

          // sends state update to new user only
          user.socket.emit('Collaboration.StateInit',
            viewportMsg);

          // sends state update to new user only
          user.socket.emit('Collaboration.StateChanged',
            objectsMsg);

          // sends state update to new user only
          user.socket.emit('Collaboration.StateChanged',
            renderMsg);
        }
      });

      /////////////////////////////////////////////////////////////////////////
      // disconnect handler
      //
      /////////////////////////////////////////////////////////////////////////
      socket.on('disconnect', function () {

        for(var meetingId in meetingMap) {

          var meeting = meetingMap[meetingId];

          // check if meeting contains this user
          if(meeting.users[socket.id]) {

            delete meeting.users[socket.id];

            var nbUsers = _.keys(meeting.users).length;

            // if no more users, kill the meeting
            if(nbUsers === 0) {

              delete meetingMap[meetingId];
            }
            else {

              emitUsersState(meeting);
            }
          }
        }
      });
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // Performs init
  //
  /////////////////////////////////////////////////////////////////////////////
  initialise();
}

module.exports = collaboration;