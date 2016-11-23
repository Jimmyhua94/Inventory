app.factory("dbFactory", ['$http', '$location', function ($http, $url, $location) {
  var obj = {};

  var success = function(res) {
    return res.data;
  }

  var error = function(res) {
    return res.data;
  }

  obj.get = function(url) {
    return $http.get(url).then(success, error);
  };

  obj.post = function(url, data) {
    return $http.post(url, data).then(success, error);
  };

  obj.patch = function(url, data) {
    return $http.patch(url, data).then(success, error);
  };

  obj.delete = function(url) {
    return $http.delete(url).then(success, error);
  };

  return obj;
}]);
