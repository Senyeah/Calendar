<?php

$clicked_date = $_GET["date"];

$info = date("r", strtotime($clicked_date));

echo "<p>The selected cell has the following date:</p><p>$info ($clicked_date)</p>";

?>