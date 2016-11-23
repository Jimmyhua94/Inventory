var app = angular.module('inventory', ['ngRoute', 'ngAnimate', 'ui.bootstrap']);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/', {templateUrl: 'partial/home.html', controller: 'inventoryCtrl'})
    .otherwise({templateUrl: 'partial/404.html'});
}]);

app.controller('inventoryCtrl', function($scope, $uibModal, dbFactory) {
  dbFactory.get('inventory').then(function (data) {
    $scope.inventory = data;
  });

  $scope.delete = function(item, index) {
    dbFactory.delete('inventory/'+item.id).then(function(res) {
      $scope.inventory.splice(index, 1);
    });
  }

  $scope.open = function(item, action) {
    var modalInstance = $uibModal.open({
      templateUrl: 'partial/edit.html',
      controller: 'editCtrl',
      resolve: {
        item: function() {
          return item;
        },
        action: function() {
          return action;
        }
      }
    });
    modalInstance.result.then(function(data) {
      if(action == 'add') {
        $scope.inventory.push(data);
      }
      else if(action == 'update') {
        item.sku = data.sku;
        item.brand = data.brand;
        item.name = data.name;
        item.description = data.description;
        item.price = data.price;
        item.stock = data.stock;
        item.category = data.category;
      }
    });
  };
});

app.controller('editCtrl', function($scope, $uibModalInstance, dbFactory, action, item) {
  if(item){
    item.price = item.price.substr(1);
    $scope.item = angular.copy(item);
  }

  $scope.cancel = function() {
    $uibModalInstance.dismiss('close');
  };
  $scope.action = function(item) {
    if(action == 'update') {
      update(item);
    }
    else {
      add(item);
    }
  }
  function add(item) {
    dbFactory.post('inventory', item).then(function (res) {
      if(res.errors) {
        console.log(res.errors);
      }
      else {
        $uibModalInstance.close(res);
      }
    });
  };
  function update(item) {
    dbFactory.patch('inventory/'+item.id,item).then(function (res) {
      if(res.errors) {
        console.log(res.errors);
      }
      else {
        $uibModalInstance.close(res);
      }
    });
  };
});
