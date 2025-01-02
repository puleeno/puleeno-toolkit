<?php

namespace Puleeno\Toolkit\Interfaces;

use Ahc\Cli\Input\Command;

interface CommandInterface
{
    public function getCommandName(): string;

    public function getAlias(): ?string;

    public function getDescription(): string;

    public function getVersion(): string;
}
