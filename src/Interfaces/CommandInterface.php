<?php

namespace Puleeno\Toolkit\Interfaces;

use Ahc\Cli\Input\Command;

interface CommandInterface
{
    public function getCommandName(): string;

    public function getAlias(): ?string;

    public function getDescription(): string;

    public function getVersion(): string;

    public function registerOptions(Command $command);

    public function execute($path = null, $paths = [], $force = false, $intentToAdd = false);
}
