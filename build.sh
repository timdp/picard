#!/usr/bin/env bash

set -e

locale=en-us
single=0
tabbed=0
build_dir=dist
force=0
all=0

while test $#; do
    case $1 in
        -l) locale="$2"; shift                    ;;
        -s) single=1                              ;;
        -t) tabbed=1                              ;;
        -o) build_dir="$2"; shift                 ;;
        -f) force=1                               ;;
        -a) all=1                                 ;;
        -*) echo "Invalid option: $1" >&2; exit 1 ;;
        *)  break                                 ;;
    esac
    shift
done

test $all -gt 0 && { single=1; tabbed=1; }

uncompressed="$build_dir/picard.js"
compressed="$build_dir/picard.min.js"

if test $force -eq 0; then
    test -e "$uncompressed" && { echo "File exists: $uncompressed"; exit 2; }
    test -e "$compressed"   && { echo "File exists: $compressed"; exit 3; }
fi

rm -f "$uncompressed" "$compressed"

sources=$(cat <<END
    picard
    picard.locale.$locale
    picard.configurable
    picard.localized
    picard.chart
    picard.view
END)

test $single -gt 0 && sources="$sources picard.view.single"
test $tabbed -gt 0 && sources="$sources picard.view.tabbed"

echo -n "Included source files:"
for file in ${sources[@]}; do
    echo -n " $file.js"
done
echo

echo "Creating file $uncompressed ..."
for file in $sources; do cat "$file.js"; done > "$uncompressed"

echo "Compiling to $compressed using Closure Compiler ..."
curl -s \
    -d compilation_level=SIMPLE_OPTIMIZATIONS \
    -d output_format=text \
    -d output_info=compiled_code \
    --data-urlencode "js_code@$uncompressed" \
    http://closure-compiler.appspot.com/compile \
    > "$compressed"

echo "Build complete!"
