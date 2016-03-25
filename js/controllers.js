var conConApp = angular.module('conConApp', ['ui.router', 'firebase', 'ngMaterial', 'chart.js', 'ngMdIcons']);
var t;
conConApp
.config(function($stateProvider, $urlRouterProvider, $mdThemingProvider) {
  $mdThemingProvider.theme('default')
  .primaryPalette('blue')
  .accentPalette('light-blue');
  $urlRouterProvider.otherwise("/home");
  //
  // Now set up the states
  $stateProvider
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
      controller: 'profileCtrl'
    })
    .state('home', {
      url: '/home',
      page_name: 'Dashboard',
      templateUrl: 'templates/home.html',
      controller: 'homeCtrl'
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
      controller: 'logCtrl'
    })
})
.run(['$rootScope', '$state', 'Auth', '$mdSidenav', function ($rootScope, $state, Auth, $mdSidenav) {
    $rootScope.toggleSidenav = function(menuId) {
      $mdSidenav(menuId).toggle();
    };
    $rootScope.$on('$stateChangeStart', function (event, toState) {
      $rootScope.pageTitle = toState.page_name;
      $rootScope.loggedIn = Auth.isLoggedIn();
      var allow = ['login', 'signup', 'exercises'];
      if(!$rootScope.loggedIn && !(allow.indexOf(toState.name) > -1)){
        console.log('DENIED');
        event.preventDefault();
        $state.go('login');

      }
    });

}])
.factory("Auth", ["$firebaseAuth",
  function($firebaseAuth) {
    var ref = new Firebase("https://concon.firebaseIO.com");
    var auth = $firebaseAuth(ref);

    return{
       signIn : function(email, password){
         return auth.$authWithPassword({
           email: email,
           password: password
         });
       },
       signOut : function(){
         return auth.$unauth();
       },
       createUser : function(email, password){
         return auth.$createUser({
           email: email,
           password: password
         })
       },
       getUserEmail : function(){
         var user = auth.$getAuth();
         return user.password.email;
       },
       getUserId : function(){
         var user = auth.$getAuth();
         return user.uid;
       },
       isLoggedIn : function(){
         var user = auth.$getAuth();
         return(user) ? user : false;
       }
     }
  }
])
.factory("ConData", ["$firebaseAuth","$firebaseArray","$firebaseObject",
  function($firebaseAuth, $firebaseArray, $firebaseObject) {
    var oneHour = 1000 * 60 * 60;
    var oneDay = 24 * oneHour;
    return{
       getExercises : function(){
         var ref = new Firebase("https://concon.firebaseio.com/exercises");
         return $firebaseArray(ref);
       },
       getBodyParts : function(){
         var ref = new Firebase("https://concon.firebaseio.com/body_parts");
         return $firebaseArray(ref);
       },
       getUserProfile : function(userId){
         var ref = new Firebase("https://concon.firebaseio.com/user_data/"+userId+"/profile");
         return $firebaseObject(ref);
       },
       getToday : function(userId, today){
         var ref = new Firebase("https://concon.firebaseio.com/user_data/"+userId);
         return $firebaseArray(ref.orderByChild("time").equalTo(today));
       },
       getHighestLevel : function(userId, exerciseId){
         var ref = new Firebase("https://concon.firebaseio.com/user_data/"+userId+"/goals_met");
         return $firebaseArray(ref.orderByChild("exercise_id").equalTo(exerciseId));
       },
       getGoalsMet : function(userId){
         var ref = new Firebase("https://concon.firebaseio.com/user_data/"+userId+"/goals_met");
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
         var ref = new Firebase("https://concon.firebaseio.com/user_data/"+userId);
         console.log(start);
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
.directive('conNavigation', function(){
  return {
    restrict: 'E',
    replace:true,
    templateUrl: 'partials/navigation.html',
    controller: function($scope, $state, Auth, ConData){
      if(Auth.isLoggedIn()){
        var userId = Auth.getUserId();
        $scope.userEmail = Auth.getUserEmail();
        $scope.user = ConData.getUserProfile(userId);
      }
      $scope.logOut = function(){
        Auth.signOut();
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

    Auth.signIn($scope.email,$scope.password)
    .then(function(authData) {
      console.log("Logged in as:", authData.uid);
      $state.go('home');
    })
    .catch(function(error) {
      console.error("Authentication failed:", error);
      $scope.error = error;
    })
  };

  $scope.createUser = function() {
    $scope.message = null;
    $scope.error = null;

    Auth.createUser($scope.email,$scope.password)
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
.controller('homeCtrl', function ($scope, $filter, Auth, ConData) { t = $scope;
  var userId = Auth.getUserId();


  $scope.goalsMet =  ConData.getGoalsMet(userId)
  
  $scope.bodyParts = ConData.getBodyParts();
  
  $scope.levelsCompleted = [];
  

  /*$scope.labels = ["January", "February", "March", "April", "May", "June", "July"];
  $scope.series = ['Series A', 'Series B'];
  $scope.data = [
    [65, 59, 80, 81, 56, 55, 40],
    [28, 48, 40, 19, 86, 27, 90]
  ];
  $scope.onClick = function (points, evt) {
    console.log(points, evt);
  };*/
})
.controller('profileCtrl', function ($scope, Auth, ConData) {
  var userId = Auth.getUserId();
  $scope.user = ConData.getUserProfile(userId);
  $scope.user.$loaded(function(){
    if(!$scope.user.email){
      $scope.user.email = Auth.getUserEmail();
      $scope.user.$save();
    }
  });
  $scope.saveProfile = function(){
    $scope.user.$save();
  }
})
.controller('logCtrl', function($scope, $filter, $stateParams, $filter, $mdDialog, $mdMedia, Auth, ConData){ t = $scope;
  var userId = Auth.getUserId();

  $scope.goalsMet = ConData.getGoalsMet(userId);

  $scope.logDate = new Date();

  $scope.$watch("selectedExercise", function() {
    $scope.moreInfo = $filter('getValById')($scope.selectedExercise, $scope.exercises, "exercise_name");
  });

  $scope.$watch("logDate", function() {
    console.log('Date Changed');
    $scope.todaysLog = ConData.getToday(userId, +moment($scope.logDate).startOf('day'));
  });

  $scope.exercises = ConData.getExercises();
  $scope.bodyParts = ConData.getBodyParts();

  $scope.todaysLog = ConData.getToday(userId, +moment($scope.logDate).startOf('day'));

  $scope.showExercise = function(ev, exercise) {
    $scope.dialogExercise = $filter('getValById')(exercise, $scope.exercises, "exercise_name");;

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
      scope: $scope,
      preserveScope: true,
      templateUrl: 'partials/log-exercise-dialog.html',
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
      $scope.todaysLog.$add({
        time: +moment($scope.logDate).startOf('day'),
        exercise_name : $scope.selectedExercise,
        step_id   : $scope.moreInfo.step_id,
        exercise_id : $scope.moreInfo.$id,
        sets: [{
          set_no: 1,
          set_val: 0
        }],
        goal_met: false
      });
      $mdDialog.cancel();
      $scope.searched = {};
      $scope.selectedExercise = null;
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
.controller('exerciseCtrl', function ($scope, ConData) { t= $scope;
  $scope.searched = {};
  $scope.exercises = [];


  $scope.exercises = ConData.getExercises();
  $scope.bodyParts = ConData.getBodyParts();
});
