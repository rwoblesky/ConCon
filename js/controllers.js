var conConApp = angular.module('conConApp', ['ui.router', 'firebase', 'ngMaterial', 'chart.js', 'ngMdIcons', 'angular.filter']);

conConApp
.config(function($stateProvider, $urlRouterProvider, $mdThemingProvider) {
  $mdThemingProvider.theme('default')
  .primaryPalette('blue')
  .accentPalette('light-blue');
  $urlRouterProvider.otherwise("/log");
  //
  // Now set up the states
  $stateProvider
    .state('about', {
      url: '/about',
      page_name: '',
      templateUrl: 'templates/about.html',
      controller: 'aboutCtrl'
    })
    .state('login', {
      url: '/login',
      page_name: 'Login',
      templateUrl: 'partials/login/login-form.html',
      controller: 'loginCtrl'
    })
    .state('signup', {
      url: '/signup',
      page_name: 'Sign Up',
      templateUrl: 'partials/login/sign-up.html',
      controller: 'loginCtrl'
    })
    .state('profile', {
      url: '/profile',
      page_name: 'My Profile',
      templateUrl: 'templates/profile.html',
      controller: 'profileCtrl',
      resolve: {
        "currentAuth": ["Auth", function(Auth) {
        // $requireSignIn returns a promise so the resolve waits for it to complete
        // If the promise is rejected, it will throw a $stateChangeError (see above)
          return Auth.$requireSignIn();
        }]
      }
    })
    .state('dashboard', {
      url: '/dashboard',
      page_name: 'Dashboard',
      templateUrl: 'templates/dashboard.html',
      controller: 'dashboardCtrl',
      resolve: {
        "currentAuth": ["Auth", function(Auth) {
        // $requireSignIn returns a promise so the resolve waits for it to complete
        // If the promise is rejected, it will throw a $stateChangeError (see above)
          return Auth.$requireSignIn();
        }]
      }
    })
    .state('exercises', {
      url: '/exercises',
      page_name: 'Exercises',
      templateUrl: 'templates/exercises.html',
      controller: 'exerciseCtrl'
    })
    .state('log', {
      url: '/log',
      page_name: 'Log Workout',
      templateUrl: 'templates/log.html',
      controller: 'logCtrl',
      resolve: {
        "currentAuth": ["Auth", function(Auth) {
        // $requireSignIn returns a promise so the resolve waits for it to complete
        // If the promise is rejected, it will throw a $stateChangeError (see above)
          return Auth.$requireSignIn();
        }]
      }
    })
    .state('history', {
      url: '/history',
      page_name: 'History',
      templateUrl: 'templates/history.html',
      controller: 'historyCtrl',
      resolve: {
        "currentAuth": ["Auth", function(Auth) {
        // $requireSignIn returns a promise so the resolve waits for it to complete
        // If the promise is rejected, it will throw a $stateChangeError (see above)
          return Auth.$requireSignIn();
        }]
      }
    })
})
.run(['$rootScope', '$state', 'Auth', '$mdSidenav', function ($rootScope, $state, $mdSidenav) {
    $rootScope.toggleSidenav = function(menuId) {
      $mdSidenav(menuId).toggle();
    };
    $rootScope.$on('$stateChangeStart', function (event, toState) {
     $rootScope.pageTitle = toState.page_name;
    });
    $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
      // We can catch the error thrown when the $requireSignIn promise is rejected
      // and redirect the user back to the home page
      if (error === "AUTH_REQUIRED") {
        $state.go("login");
      }
    });

}])
.factory("Auth", ["$firebaseAuth",
  function($firebaseAuth) {
    return $firebaseAuth();
  }
])
.factory("ConData", ["$firebaseAuth","$firebaseArray","$firebaseObject",
  function($firebaseAuth, $firebaseArray, $firebaseObject) {
    var oneHour = 1000 * 60 * 60;
    var oneDay = 24 * oneHour;
    return{
       getExercises : function(){
         var ref = firebase.database().ref().child("exercises");
         return $firebaseArray(ref);
       },
       getBodyParts : function(){
         var ref = firebase.database().ref().child("body_parts");
         return $firebaseArray(ref);
       },
       getUserProfile : function(userId){
         var ref = firebase.database().ref().child("user_data").child(userId).child("profile");
         return $firebaseObject(ref);
       },
       getToday : function(userId, today){
         var ref = firebase.database().ref().child("user_data").child(userId);
         return $firebaseArray(ref.orderByChild("time").equalTo(today));
       },
       getHighestLevel : function(userId, exerciseId){
         var ref = firebase.database().ref().child("user_data").child(userId).child("goals_met");
         return $firebaseArray(ref.orderByChild("exercise_id").equalTo(exerciseId));
       },
       getRecentExercises : function(userId, exerciseId){//TODO: Write this function, will be added to the exercise card
         var ref = firebase.database().ref().child("user_data").child(userId);
         return $firebaseArray(ref.orderByChild("exercise_id").equalTo(exerciseId));
       },
       getHistory : function(userId){
         var ref = firebase.database().ref().child("user_data").child(userId);
         return $firebaseArray(ref);
       },
       getGoalsMet : function(userId){
         var ref = firebase.database().ref().child("user_data").child(userId).child("goals_met");
         return $firebaseArray(ref);
       },
       getRecents: function(userId, startDate, days){
         if(!days){
           days = 10;
         }
         if(!startDate){
           startDate = new Date().getTime();
         }
         var start = startDate - (days * oneDay);
         var ref = firebase.database().ref().child("user_data").child(userId);
         return $firebaseArray(ref.orderByChild('time').startAt(start));
       }
     }
  }
])
.filter('getValById', function(){
  return function(id, arrayOfObjects, lookupKey){
    for(var i = 0; i < arrayOfObjects.length; i++){
      if(arrayOfObjects[i][lookupKey] === id){
        return arrayOfObjects[i];
      }
    }
    return null;
  }
})
.filter('goalMet', function(){
  return function(sets, exercise){
    if(exercise.goal_sets >= sets.length){
      var goalReps = exercise.goal_reps;
      var goalsMet = 0;
      if(sets.length >= exercise.goal_sets){
        for(var i = 0; i < sets.length; i++){
          if(sets[i].set_val >= goalReps) goalsMet++;
        }
      }
      return goalsMet >= exercise.goal_sets;
    } else {
      return;
    }

  }
})
.filter('getSetCount', function(){
  return function(bodyPart, sets){
    var count = 0;
    for(var i = 0; i < sets.length; i++){
      if(sets[i].body_part === bodyPart){
        count++;
      }
    }
    return count;
  }
})
.filter('highestReps', function(){
  return function(recentExercises){
    if(recentExercises){
      var highestReps = 0;
      for(var i = 0; i < recentExercises.length; i++){
        for(var j = 0; j < recentExercises[i].sets.length; j++){
          var reps = parseInt(recentExercises[i].sets[j].set_val);
          if(reps > highestReps){
            highestReps = reps;
          }
        }
      }
      return highestReps;
    } else {
      return recentExercises;
    }
  }
})
.filter('recentSet', function(){
  return function(setNo, recentSets){
    if(recentSets){
      for(var i = 0; i < recentSets.length; i++){
        if(setNo === recentSets[i].set_no){
          return recentSets[i];
        }
      }
    } else {
      return "N/A";
    }

  }
})
.filter('highestLevels', function(){
  return function(bodyParts, goalsMet){//TODO: I'd like to revist this function someday....I hate looping and inner loops, but works for now

    for(var i = 0; i < bodyParts.length; i++){
      bodyParts[i].highestLevelCompleted = 0;
    }
    for(var i = 0; i < goalsMet.length; i++){
      for(var j = 0; j < bodyParts.length; j++){
        if(bodyParts[j].$id === goalsMet[i].body_part && bodyParts[j].highestLevelCompleted < goalsMet[i].step){
          bodyParts[j].highestLevelCompleted = goalsMet[i].step;
        }
      }
    }

    return bodyParts;
  }
})
.directive('conNavigation', function(){
  return {
    restrict: 'E',
    replace:true,
    templateUrl: 'partials/navigation.html',
    controller: function($scope, $state, Auth, ConData){
      $scope.auth = Auth;

      // any time auth state changes, add the user data to scope
      $scope.auth.$onAuthStateChanged(function(firebaseUser) {
          $scope.firebaseUser = firebaseUser;
          if(firebaseUser){
            var userId = Auth.$getAuth().uid;
            $scope.user = ConData.getUserProfile(userId);
          }
      });

      $scope.signOut = function(){
        Auth.$signOut();
        $state.go('login');
      }
    }
  };
})
.directive('exerciseFilter', function(){
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'partials/exercise-filter.html',
    controller: function($scope, ConData){
      $scope.exerciseTypes = [
        {
        name: 'Strength',
        val: 'strength',
        },
        {
        name: 'Pylos',
        val: 'pylos',
        }
      ];

      $scope.bodyParts = ConData.getBodyParts();

      $scope.clearFilters = function(){
        $scope.searched = {};
      }
    }
  };
})
.directive('errSrc', function() {
  return {
    link: function(scope, element, attrs) {
      element.bind('error', function() {
        if (attrs.src != attrs.errSrc) {
          attrs.$set('src', attrs.errSrc);
        }
      });
    }
  }
})
.controller('loginCtrl', function ($scope, $state, Auth) {


  $scope.signIn = function() {
    $scope.message = null;
    $scope.error = null;

    Auth.$signInWithEmailAndPassword($scope.email,$scope.password)
    .then(function(authData) {
      console.log("Logged in as:", authData.uid);
      $state.go('log');
    })
    .catch(function(error) {
      console.error("Authentication failed:", error);
      $scope.error = error;
    })
  };

  $scope.createUser = function() {
    $scope.message = null;
    $scope.error = null;

    Auth.$createUserWithEmailAndPassword($scope.email,$scope.password)
    .then(function(userData) {
      $scope.message = "User created with uid: " + userData.uid;
      $state.go('login');
    })
    .catch(function(error) {
      $scope.error = error;
    });
  };

  $scope.removeUser = function() {
    $scope.message = null;
    $scope.error = null;

    Auth.$removeUser({
      email: $scope.email,
      password: $scope.password
    }).then(function() {
      $scope.message = "User removed";
    }).catch(function(error) {
      $scope.error = error;
    });
  };

})
.controller('dashboardCtrl', function ($scope, $filter, $q, Auth, ConData) {
  var userId = Auth.$getAuth().uid;
  //$q.all([ConData.getBodyParts(), ]).then(function(data){
  $scope.bodyParts = ConData.getBodyParts();


  $scope.goalsMet = ConData.getGoalsMet(userId);


  //});


})
.controller('profileCtrl', function ($scope, $state, Auth, ConData) {
  var userId = Auth.$getAuth().uid;
  $scope.user = ConData.getUserProfile(userId);
  $scope.user.$loaded(function(){
    if(!$scope.user.email){
      $scope.user.email = Auth.getUserEmail();
      $scope.user.$save();
    }
  });
  $scope.saveProfile = function(){
    $scope.user.$save();
    $state.reload();
  }
})
.controller('logCtrl', function($scope, $filter, $stateParams, $filter, $mdDialog, $mdMedia, Auth, ConData){
  var userId = Auth.$getAuth().uid;

  $scope.exercises = [];
  $scope.bodyParts = [];

  $scope.logDate = new Date();

  $scope.$watch("selectedExercise", function() {
    $scope.moreInfo = $filter('getValById')($scope.selectedExercise, $scope.exercises, "exercise_name");
  });

  $scope.$watch("logDate", function() {
    $scope.todaysLog = ConData.getToday(userId, +moment($scope.logDate).startOf('day'));
  });

  $scope.exercises = ConData.getExercises();

  $scope.bodyParts = ConData.getBodyParts();

  $scope.goalsMet =  ConData.getGoalsMet(userId);

  $scope.todaysLog = ConData.getToday(userId, +moment($scope.logDate).startOf('day'));

  $scope.showExercise = function(ev, exercise) {
    $scope.dialogExercise = $filter('getValById')(exercise, $scope.exercises, "exercise_name");

    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
    $mdDialog.show({
      controller: DialogController,
      scope: $scope,
      preserveScope: true,
      templateUrl: 'partials/exercise-dialog.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:true,
      fullscreen: useFullScreen
    })
    .then(function(answer) {
      $scope.status = 'You said the information was "' + answer + '".';
    }, function() {
      $scope.status = 'You cancelled the dialog.';
    });
    $scope.$watch(function() {
      return $mdMedia('xs') || $mdMedia('sm');
    }, function(wantsFullScreen) {
      $scope.customFullscreen = (wantsFullScreen === true);
    });
  };

  $scope.showAdvanced = function(ev) {
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
    $mdDialog.show({
      controller: DialogController,
      scope: $scope.$new(),
      //preserveScope: true,
      templateUrl: 'partials/log-exercise-dialog.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:true,
      fullscreen: useFullScreen
    });
    $scope.$watch(function() {
      return $mdMedia('xs') || $mdMedia('sm');
    }, function(wantsFullScreen) {
      $scope.customFullscreen = (wantsFullScreen === true);
    });
  };


  function DialogController($scope, $mdDialog, parent) {
    $scope.hide = function() {
      $mdDialog.hide();
    };
    $scope.cancel = function() {
      $mdDialog.cancel();
    };
    $scope.answer = function(answer) {
      $mdDialog.hide(answer);
    };
    $scope.addToWorkout = function(){
      if($scope.selectedExercise){
        var exercise = $filter('getValById')($scope.selectedExercise, $scope.exercises, "exercise_name");
        var recents = ConData.getRecentExercises(userId, exercise.$id);
        recents.$loaded().then(function(recents){

          console.log(recents.length);
          $scope.todaysLog.$add({
            time: +moment($scope.logDate).startOf('day'),
            exercise_name : $scope.selectedExercise,
            step_id   : exercise.step_id,
            exercise_id : exercise.$id,
            highestReps : $filter('highestReps')(recents),
            recentSets : (recents.length > 0) ? recents.pop().sets : [],
            lastExercised : (recents.length > 0) ? recents.pop().time : 'N/A',
            sets: [{
              set_no: 1,
              set_val: 0
            }],
            goal_met: false
          });
          $mdDialog.hide();
          $scope.selectedExercise = null;
        });
      } else {
        return;
      }
    };
  }


  $scope.change = function(exercise){
    var sets = $scope.todaysLog[$scope.todaysLog.indexOf(exercise)].sets;
    var exerciseData = $scope.exercises[exercise.exercise_id];

    if(exercise.goal_met === false && $filter('goalMet')(sets, exerciseData)){
      exercise.goal_met = true;
      var foundInGoal = false;
      for(var i = 0; i < $scope.goalsMet.length; i++){
        if($scope.goalsMet[i].exercise_id === exercise.exercise_id){
          console.log('Goal already met');
          foundInGoal = true;
        }
      }
      if(!foundInGoal){
        $scope.goalsMet.$add({
          exercise_id: exercise.exercise_id,
          step: exerciseData.step,
          body_part: exerciseData.body_part,
          goal_met: true,
          first_met: +moment($scope.logDate).startOf('day'),
          times_met: [+moment($scope.logDate).startOf('day')]
        })
      }
    }

    $scope.todaysLog.$save($scope.todaysLog.indexOf(exercise)).then(function(ref) {
      console.log('saved');
    }, function(error) {
      console.log("Error:", error)
    });

  }


  $scope.addSet = function(exercise){
    console.log('add set to ' +  exercise);
    exercise.sets.push({
      set_no: exercise.sets.length + 1,
      set_val: 0
    });
    $scope.todaysLog.$save($scope.todaysLog.indexOf(exercise)).then(function(ref) {
      console.log('saved');
    }, function(error) {
      console.log("Error:", error)
    });
  };


})
.controller('exerciseCtrl', function ($scope, $filter, $mdMedia, $mdDialog, ConData) {
  $scope.searched = {};
  $scope.exercises = [];
  function DialogController($scope, $mdDialog, parent) {
    $scope.hide = function() {
      $mdDialog.hide();
    };
    $scope.cancel = function() {
      $mdDialog.cancel();
    };
    $scope.answer = function(answer) {
      $mdDialog.hide(answer);
    };
  }
  $scope.showExercise = function(ev, exercise) {
    $scope.dialogExercise = $filter('getValById')(exercise, $scope.exercises, "exercise_name");
    console.log($scope.dialogExercise);

    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
    $mdDialog.show({
      controller: DialogController,
      scope: $scope,
      preserveScope: true,
      templateUrl: 'partials/exercise-dialog.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:true,
      fullscreen: useFullScreen
    })
    .then(function(answer) {
      $scope.status = 'You said the information was "' + answer + '".';
    }, function() {
      $scope.status = 'You cancelled the dialog.';
    });
    $scope.$watch(function() {
      return $mdMedia('xs') || $mdMedia('sm');
    }, function(wantsFullScreen) {
      $scope.customFullscreen = (wantsFullScreen === true);
    });
  };


  $scope.exercises = ConData.getExercises();
  $scope.bodyParts = ConData.getBodyParts();
})
.controller('historyCtrl', function ($scope, Auth, ConData) {
  var userId = Auth.$getAuth().uid;

  $scope.history = ConData.getHistory(userId);
})
.controller('aboutCtrl', function ($scope, Auth, ConData) {
  $scope.tiles = [
    {"title":"One-Arm Pushups","src":"img/exercises/strength/chest/8.jpg" , "background":"red","span":{"row":2,"col":2}},
    {"title":"Single-Leg Squats","src":"img/exercises/strength/legs/8.jpg" , "background":"green","span":{"row":1,"col":1}},
    {"title":"One-Arm Pullups","src":"img/exercises/strength/upper_back/8.jpg" , "background":"darkBlue","span":{"row":1,"col":1}},
    {"title":"Crowstand","src":"img/exercises/strength/shoulders/2.jpg" , "background":"blue","span":{"row":1,"col":2}},
    {"title":"Handstand Pushups","src":"img/exercises/strength/shoulders/5.jpg" , "background":"yellow","span":{"row":2,"col":2}},
    {"title":"Back Bridge","src":"img/exercises/strength/core_back/10.jpg" , "background":"pink","span":{"row":1,"col":1}},
    {"title":"Close Grip Pushups","src":"img/exercises/strength/chest/6.jpg" , "background":"darkBlue","span":{"row":1,"col":1}},
    {"title":"Leg Raises","src":"img/exercises/strength/core_front/5.jpg" , "background":"purple","span":{"row":1,"col":1}},
    {"title":"Close Squats","src":"img/exercises/strength/legs/6.jpg" , "background":"deepBlue","span":{"row":1,"col":1}},
    {"title":"Assisted One-Arm Pullups","src":"img/exercises/strength/upper_back/9.jpg" , "background":"lightPurple","span":{"row":1,"col":1}},
    {"title":"Shoulder Stand Squats","src":"img/exercises/strength/legs/1.jpg" , "background":"yellow","span":{"row":1,"col":1}}
  ];

});
