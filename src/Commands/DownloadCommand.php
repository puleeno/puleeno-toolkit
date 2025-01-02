<?php

namespace Puleeno\Toolkit\Commands;

use Puleeno\Toolkit\CommandAbstract;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;
use Unirest\Request;

class DownloadCommand extends CommandAbstract
{
    protected $name = 'net:download';

    protected $description = 'Download file from URL or text file';

    protected $version = '2024.01.02';


    protected $outputDirectory = null;

    protected function configure()
    {
        $this->addArgument('filename', InputArgument::REQUIRED, 'Path of text file or full URL format')
            ->addOption('output', ['o'], InputOption::VALUE_OPTIONAL, 'Set output directory when downloading');
    }

    protected function getOutputDirectory()
    {
        if (empty($this->outputDirectory)) {
            $this->outputDirectory = constant('PULEENO_TOOLKIT_WORKING_DIR');
        }
        return $this->outputDirectory;
    }

    protected function isUrlFormat($url)
    {
        return preg_match('/((https?\:)|^\/\/)/', $url);
    }

    protected function prepareDirectory($dir)
    {
        if (!file_exists($dir)) {
            @mkdir($dir, 0755, true);
        }
    }

    protected function downloadFile($url)
    {
        // Thực hiện yêu cầu GET để tải file
        $response = Request::get($url, [], ['followRedirects' => true]);
        $host = parse_url($url);
        $parsedHost = explode($host['host'] . '/', $url);
        $path = end($parsedHost);
        $path = str_replace('/', DIRECTORY_SEPARATOR, $path);

        // Kiểm tra xem yêu cầu có thành công hay không
        if ($response->code === 200) {
            // Lưu file vào thư mục
            $filePath = implode(DIRECTORY_SEPARATOR, [$this->getOutputDirectory(), $path]);

            $this->prepareDirectory(dirname($filePath));
            file_put_contents($filePath, $response->raw_body);
        } else {
            echo "Có lỗi xảy ra khi tải file. Mã lỗi: " . $response->code;
        }
    }

    protected function downloadFiles($urls)
    {
        foreach ($urls as $url) {
            $this->downloadFile($url);
        }
    }


    protected function getFileUrls($fileName)
    {
        $files = [$fileName, implode(DIRECTORY_SEPARATOR, [constant('PULEENO_TOOLKIT_WORKING_DIR'), $fileName])];
        $loadedFilename = null;
        foreach ($files as $file) {
            if (!file_exists($file)) {
                continue;
            }
            $loadedFilename = $file;
            break;
        }

        $urlStr = file_get_contents($loadedFilename);
        if (empty($urlStr)) {
            return [];
        }
        $urlStr = trim($urlStr);
        $urls = explode("\n", $urlStr);

        return $urls;
    }

    public function execute(\Symfony\Component\Console\Input\InputInterface $input, \Symfony\Component\Console\Output\OutputInterface $output)
    {
        if (empty(trim($input->getArgument('filename')))) {
            throw new \Exception("Please check your agrument. URL or file name is not mentioned");
        }
        $fileName = $input->getArgument('filename');
        $files = $this->isUrlFormat($fileName) ? [$fileName] : $this->getFileUrls($fileName);

        if (empty($files)) {
            throw new \Exception("List files is empty");
        }
        $this->downloadFiles($files);
    }
}
