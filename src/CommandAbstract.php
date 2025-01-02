<?php

namespace Puleeno\Toolkit;

use Ahc\Cli\Input\Command;
use Puleeno\Toolkit\Interfaces\CommandInterface;

abstract class CommandAbstract implements CommandInterface
{
    protected $name;

    protected $description = '';

    protected $version = '0.0.0';

    protected $command;

    public function __construct()
    {
    }

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

    public function registerOptions(Command $command)
    {
    }
}
