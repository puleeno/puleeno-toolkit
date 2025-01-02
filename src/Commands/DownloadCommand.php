<?php

namespace Puleeno\Toolkit\Commands;

use Puleeno\Toolkit\CommandAbstract;

class DownloadCommand extends CommandAbstract
{
    protected $name = 'download';

    protected $version = '2024.01.02';

    public function execute($path = null, $paths = [], $force = false, $intentToAdd = false)
    {
    }
}
