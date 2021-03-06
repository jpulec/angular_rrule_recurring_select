angular.module('rruleRecurringSelect', []).directive('rruleRecurringSelect', [function() {
  return {
    restrict: 'AE',
    scope: {
      rule: "=",
      okClick: "=",
      cancelClick: "=",
      showButtons: "="
    },
    templateUrl: 'template/rrule_recurring_select.html',
    link: function(scope, elem, attrs) {
      scope.init = function() {
        scope.initFrequencies();
        scope.initWeekOrdinals();
        scope.selectedMonthFrequency = 'day_of_month';
        scope.resetData();
        scope.$watch(scope.currentRule, scope.ruleChanged);
        if(!_.isEmpty(scope.rule))
          scope.parseRule(scope.rule);
      };

      scope.initFrequencies = function() {
        scope.frequencies = [
          { name: 'Daily', rruleType: RRule.DAILY, type: 'day' },
          { name: 'Weekly', rruleType: RRule.WEEKLY, type: 'week' },
          { name: 'Monthly', rruleType: RRule.MONTHLY, type: 'month' },
          { name: 'Yearly', rruleType: RRule.YEARLY, type: 'year' }
        ];
        scope.selectedFrequency = scope.frequencies[0];
      };

      scope.initMonthlyDays = function() {
        scope.monthDays = [];

        _.times(31, function(index) {
          scope.monthDays.push({ day: index + 1, value: index + 1, selected: false });
        });

        scope.monthDays.push({ day: 'Last Day', value: -1, selected: false });
      };

      scope.initWeekOrdinals = function() {
        scope.weekOrdinals = ['st', 'nd', 'rd', 'th'];
      };

      scope.initMonthlyWeeklyDays = function() {
        scope.monthWeeklyDays = [];

        _.times(4, function(index) {
          var days = _.map(scope.daysOfWeek(), function(dayOfWeek){
            dayOfWeek.value = dayOfWeek.value.nth(index + 1);
            return dayOfWeek;
          });
          scope.monthWeeklyDays.push(days);
        });
      };

      scope.resetData = function() {
        scope.weekDays = scope.daysOfWeek();
        scope.initMonthlyDays();
        scope.initMonthlyWeeklyDays();
        scope.interval = '';
        scope.recurrenceRule = null;
      };

      scope.daysOfWeek = function() {
        return [
          { name: 'S', value: RRule.SU, selected: false },
          { name: 'M', value: RRule.MO, selected: false },
          { name: 'T', value: RRule.TU, selected: false },
          { name: 'W', value: RRule.WE, selected: false },
          { name: 'T', value: RRule.TH, selected: false },
          { name: 'F', value: RRule.FR, selected: false },
          { name: 'S', value: RRule.SA, selected: false },
        ];
      };

      scope.selectMonthFrequency = function(monthFrequency) {
        scope.selectedMonthFrequency = monthFrequency;
        scope.resetData();
        scope.calculateRRule();
      };

      scope.toggleSelected = function(day) {
        day.selected = !day.selected;
        scope.calculateRRule();
      };

      scope.calculateRRule = function() {
        var interval = parseInt(scope.interval);
        if (!interval)
          return

        switch(scope.selectedFrequency.type) {
          case 'day':
            scope.calculateDailyRRule();
            break;
          case 'week':
            scope.calculateWeeklyRRule();
            break;
          case 'month':
            scope.calculateMonthlyRRule();
            break;
          case 'year':
            scope.calculateYearlyRRule();
        }

        if(!_.isUndefined(scope.rule) && !_.isEmpty(scope.recurrenceRule))
          scope.rule = scope.recurrenceRule.toString();
      };

      scope.calculateInterval = function() {
        var interval = parseInt(scope.interval);
        if (!interval)
          interval = 1;
        return interval;
      };

      scope.calculateDailyRRule = function() {
        scope.recurrenceRule = new RRule({
          freq: RRule.DAILY,
          interval: scope.calculateInterval(),
          wkst: RRule.SU
        });
      };

      scope.calculateWeeklyRRule = function() {
        var selectedDays = _(scope.weekDays).select(function(day) {
          return day.selected;
        }).pluck('value').value();

        if (!selectedDays.length)
          return

        scope.recurrenceRule = new RRule({
          freq: RRule.WEEKLY,
          interval: scope.calculateInterval(),
          wkst: RRule.SU,
          byweekday: selectedDays
        });
      };

      scope.calculateMonthlyRRule = function() {
        if(scope.selectedMonthFrequency == 'day_of_month')
          scope.calculateDayOfMonthRRule();
        else
          scope.calculateDayOfWeekRRule();
      };

      scope.calculateDayOfMonthRRule = function() {
        var selectedDays = _(scope.monthDays).select(function(day) {
          return day.selected;
        }).pluck('value').value();

        if (!selectedDays.length)
          return

        scope.recurrenceRule = new RRule({
          freq: RRule.MONTHLY,
          interval: scope.calculateInterval(),
          wkst: RRule.SU,
          bymonthday: selectedDays
        });
      };

      scope.calculateDayOfWeekRRule = function() {
        var selectedDays = _(scope.monthWeeklyDays).flatten().select(function(day) {
          return day.selected;
        }).pluck('value').value();

        if (!selectedDays.length)
          return

        scope.recurrenceRule = new RRule({
          freq: RRule.MONTHLY,
          interval: scope.calculateInterval(),
          wkst: RRule.SU,
          byweekday: selectedDays
        });
      };

      scope.calculateYearlyRRule = function() {
        scope.recurrenceRule = new RRule({
          freq: RRule.YEARLY,
          interval: scope.calculateInterval(),
          byyearday: [1]
        });
      };

      scope.parseRule = function(rRuleString) {
        scope.recurrenceRule = RRule.fromString(rRuleString);

        scope.interval = scope.recurrenceRule.options.interval;

        scope.selectedFrequency = _.select(scope.frequencies, function(frequency) {
          return frequency.rruleType == scope.recurrenceRule.options.freq;
        })[0];

        switch(scope.selectedFrequency.type) {
          case 'week':
            scope.initFromWeeklyRule();
          case 'month':
            scope.initFromMonthlyRule();
        }
      };

      scope.initFromWeeklyRule = function() {
        var ruleSelectedDays = scope.recurrenceRule.options.byweekday;

        _.each(scope.weekDays, function(weekDay) {
          if (_.contains(ruleSelectedDays, weekDay.value.weekday))
            weekDay.selected = true;
        });
      };

      scope.initFromMonthlyRule = function() {
        if(!_.isEmpty(scope.recurrenceRule.options.bymonthday) || !_.isEmpty(scope.recurrenceRule.options.bynmonthday))
          scope.initFromMonthDays();
        else if(!_.isEmpty(scope.recurrenceRule.options.bynweekday))
          scope.initFromMonthWeekDays();
      };

      scope.initFromMonthDays = function() {
        var ruleMonthDays = scope.recurrenceRule.options.bymonthday;
        scope.selectedMonthFrequency = 'day_of_month';

        _.each(scope.monthDays, function(weekDay) {
          if(_.contains(ruleMonthDays, weekDay.value))
            weekDay.selected = true;
        });

        if(scope.recurrenceRule.options.bynmonthday.length > 0 && scope.recurrenceRule.options.bynmonthday[0] == -1)
          scope.monthDays[31].selected = true;
      };

      scope.initFromMonthWeekDays = function() {
        var ruleWeekMonthDays = scope.recurrenceRule.options.bynweekday;
        scope.selectedMonthFrequency = 'day_of_week';

        _.each(ruleWeekMonthDays, function(ruleArray) {
          var dayIndex = ruleArray[0];
          var weekIndex = ruleArray[1] - 1;

          var week = scope.monthWeeklyDays[weekIndex];
          _.each(week, function(day) {
            if (day.value.weekday == dayIndex) {
              day.selected = true;
              return;
            }
          });
        });
      };

      scope.ruleChanged = function() {
        scope.resetData();
        if (!_.isEmpty(scope.rule)) {
          scope.parseRule(scope.rule);
        }
      };

      scope.currentRule = function() {
        return scope.rule;
      };

      scope.init();
    }
  }
}]);

angular.module("rrule.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("template/rrule_recurring_select.html","<div class=\"rrule-recurring-select\">\n  <h3>Repeat</h3>\n\n  <div class=\"frequency-type\">\n    <select ng-model=\"selectedFrequency\" ng-options=\"frequency as frequency.name for frequency in frequencies\" ng-change=\"resetData()\" required>\n    </select>\n  </div>\n\n  <div class=\"interval\">\n    Every <input type=\"text\" ng-model=\"interval\" ng-change=\"calculateRRule()\" /> {{selectedFrequency.type}}(s):\n  </div>\n\n  <div class=\"weekly\" ng-if=\"selectedFrequency.type == \'week\'\">\n    <ul>\n      <li ng-repeat=\"day in weekDays\" ng-click=\"toggleSelected(day)\" ng-class=\"{ selected: day.selected }\">\n        {{day.name}}\n      </li>\n    </ul>\n  </div>\n\n  <div class=\"monthly {{selectedMonthFrequency}}\" ng-if=\"selectedFrequency.type == \'month\'\">\n    <input type=\"radio\" ng-model=\"selectedMonthFrequency\" ng-click=\"selectMonthFrequency(\'day_of_month\')\" value=\"day_of_month\"/>Day of month\n    <input type=\"radio\" ng-model=\"selectedMonthFrequency\" ng-click=\"selectMonthFrequency(\'day_of_week\')\" value=\"day_of_week\"/>Day of week\n\n    <ul class=\"month-days\">\n      <li ng-repeat=\"day in monthDays\" ng-click=\"toggleSelected(day)\" ng-class=\"{ selected: day.selected }\" ng-if=\"selectedMonthFrequency == \'day_of_month\'\">\n        {{day.day}}\n      </li>\n    </ul>\n\n    <ul class=\"month-week-days\">\n      <li ng-repeat=\"week in monthWeeklyDays\" ng-if=\"selectedMonthFrequency == \'day_of_week\'\">\n        <ul class=\"week-days\">\n          <li class=\"week-index-title\">{{$index + 1}}{{weekOrdinals[$index]}}</li>\n          <li ng-repeat=\"day in week\" ng-click=\"toggleSelected(day)\" ng-class=\"{ selected: day.selected }\">\n            {{ day.name }}\n          </li>\n        </ul>\n      </li>\n    </ul>\n  </div>\n\n  <div class=\"actions\">\n    <hr />\n\n    <div class=\"summary\">\n      Summary: {{selectedFrequency.name}}\n      <div class=\"description\">\n        {{ recurrenceRule.toText() }}\n      </div>\n    </div>\n\n    <div class=\"button ok\" ng-if=\"showButtons\" ng-click=\"okClick()\">Ok</div>\n    <div class=\"button cancel\" ng-if=\"showButtons\" ng-click=\"cancelClick()\">Cancel</div>\n  </div>\n</div>\n");}]);