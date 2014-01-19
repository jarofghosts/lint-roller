var through = require('through2'),
    falafel = require('falafel'),
    fs = require('fs')

module.exports = lintroller

function lintroller(_checks) {
  var count = 0,
      files = [],
      stream = through(add_files, noop),
      checks = _checks || []

  checks.forEach(resolve_check)
  checks = checks.filter(Boolean)

  return stream

  function add_files(chunk, enc, next) {
    files.push(chunk.toString())

    if (!count) {
      count++
      read_file(files.shift())
    }

    next()
  }

  function read_file(filename) {
    fs.readFile(filename, 'utf8', process_file)

    function process_file(err, data) {
      if (err) process.stdout.write('whoopsie goldberg') && process.exit(1)
      falafel('' + data, check_node)
      if (!files.length) return finish()
      count++
      read_file(files.shift())
    }
  }

  function check_node(node) {
    checks.forEach(run_check)

    function run_check(check) {
      if (check.selectors.some(match_selector)) {
        check.rules.forEach(compare_and_count)
      }
      
      function match_selector(selector) {
        return selector(node)
      }

      function compare_and_count(rule) {
        if (rule.test(node)) rule.count++
      }
    }
  }

  function finish() {
    process.stdout.write('processed ' + count + ' files\n')
    console.dir(checks)
  }
}

function resolve_check(check) {
  if (typeof check === 'string') {
    try {
      check = require(check)
    } catch(e) {
      check = false
      return
    }
  }

  if (!check.rules || !check.rules.length) {
    check = false
    return
  }

  check.rules.forEach(validate_rules)
  check.rules = check.rules.filter(Boolean)
    
  function validate_rules(rule) {
    if (!rule.name || !rule.test || typeof rule.test !== 'function') {
      rule = false
      return
    }

    rule.description = rule.description || rule.name
    rule.count = rule.count || 0
  }
}

function noop() {}
