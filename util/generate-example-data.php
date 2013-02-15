<?php

/*
 * PiCard
 * Copyright (c) 2013 Tim De Pauw <http://timdp.github.com/>
 * Released under the MIT License
 */

$num_projects = 5;
$min_users = 3;
$max_users = 8;
$min_commits = 0;
$max_commits = 100;

foreach (range(1, $num_projects) as $project_id) {
    $data = array();
    $user_count = mt_rand($min_users, $max_users);
    foreach (range(1, $user_count) as $user_id) {
        $user_name = "User $user_id";
        foreach (range(0, 6) as $day) {
            foreach (range(0, 23) as $hour) {
                $commit_count = mt_rand($min_commits, $max_commits);
                $data[$user_name][$day][$hour] = $commit_count;
            }
        }
    }
    $file = "../example-data/project$project_id.json";
    file_put_contents($file, json_encode($data, JSON_FORCE_OBJECT));
}
