<?php

namespace Puleeno\Toolkit;

use Cilex\Provider\Console\Command;
use Puleeno\Toolkit\Interfaces\CommandInterface;

abstract class CommandAbstract extends Command implements CommandInterface
{
    protected $name;

    protected $description = '';

    protected $version = '0.0.0';

    public function getCommandName(): string
    {
        return $this->name;
    }

    public function getAlias(): ?string
    {
        return null;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getVersion(): string
    {
        return $this->version;
    }
}
