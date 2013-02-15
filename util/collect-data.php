<?php

/*
 * PiCard
 * Copyright (c) 2013 Tim De Pauw <http://timdp.github.com/>
 * Released under the MIT License
 */


// DOCUMENTATION /////////////////////////////////////////////////////////////

// This utility parses all your Git repositories' commit logs and generates
// JSON data files in the format required by PiCard.


// CONFIGURATION /////////////////////////////////////////////////////////////

// Where are your Git repositories?
$input_dir = '/var/git';

// Where do you want the JSON files for PiCard?
$output_dir = '/var/www/html/picard/data';


// SCRIPT ////////////////////////////////////////////////////////////////////

$dir_list = scandir($input_dir);
foreach ($dir_list as $repo) {
    $path = "$input_dir/$repo";
    if ($repo == '.' || $repo == '..'
            || !is_readable($path) || !is_dir($path)) {
        continue;
    }
    $stats = array();
    $cmd = 'cd "' . $path . '" && '
        . 'git log --all --no-merges --pretty=format:%H,%at,%an';
    $ph = popen($cmd, 'r');
    if ($ph !== false) {
        while (($line = fgets($ph)) !== false) {
            list($hash, $date, $user) = explode(',', rtrim($line), 3);
            $date = intval($date);
            $wday = (date('w', $date) + 6) % 7;
            $hour = date('G', $date);
            $stats[$user][$wday][$hour]++;
        }
        pclose($ph);
    } else {
        echo "$path: $php_errormsg", PHP_EOL;
    }
    $file = "$output_dir/$repo.json";
    file_put_contents($file, json_encode($stats, JSON_FORCE_OBJECT));
}


//////////////////////////////////////////////////////////////////////////////
