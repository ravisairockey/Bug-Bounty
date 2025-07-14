<div align="center">
  <img src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExNnU4eDIxbTQzaDY4NTZsOGQ4OGE0bWtwdWxkdTZvdXQ3cW1yOWY3ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/axnFGXT6MzvgY/giphy.gif" alt="Bug Bounty Methodology Banner" width="800">
  <h1>Bug Bounty Methodology</h1>
  <p>A community-driven guide to bug bounty hunting.</p>
  
  <p>
    <img src="https://img.shields.io/github/issues/ravisairockey/Bug-Bounty?style=for-the-badge&logo=github" alt="GitHub issues">
    <img src="https://img.shields.io/github/forks/ravisairockey/Bug-Bounty?style=for-the-badge&logo=github" alt="GitHub forks">
    <img src="https://img.shields.io/github/stars/ravisairockey/Bug-Bounty?style=for-the-badge&logo=github" alt="GitHub stars">
  </p>
</div>

This repository provides a comprehensive methodology for bug bounty hunting, designed to guide beginners through the process of finding and reporting vulnerabilities. The methodology is broken down into several key stages, from initial reconnaissance to vulnerability scanning and analysis.

## Table of Contents

- [Bug Bounty Methodology](#bug-bounty-methodology)
  - [Table of Contents](#table-of-contents)
  - [1. Active Domain Enumeration](#1-active-domain-enumeration)
  - [2. Open Ports Scan](#2-open-ports-scan)
  - [3. Directory Search](#3-directory-search)
  - [4. Parameter Discovery](#4-parameter-discovery)
  - [5. Parameter Filtering](#5-parameter-filtering)
  - [6. JS File Enumeration](#6-js-file-enumeration)
  - [7. JS File Analysis](#7-js-file-analysis)
  - [8. Automated Vulnerability Scanning (Nuclei)](#8-automated-vulnerability-scanning-nuclei)
  - [9. Secret Finding](#9-secret-finding)
  - [Contributing](#contributing)
  - [Disclaimer](#disclaimer)

## 1. Active Domain Enumeration

The first step in any reconnaissance process is to identify live and active domains from a given list. This helps in focusing the subsequent scanning efforts on responsive targets.

```bash
cat domain.txt | httpx-toolkit -l domain.txt -ports 443,80,8080,8000,888 -threads 200 > alive.txt
```

-   **`cat domain.txt`**: Reads the list of domains from `domain.txt`.
-   **`httpx-toolkit`**: A fast and multi-purpose HTTP toolkit that allows running multiple probers.
-   **`-l domain.txt`**: Specifies the input list of domains.
-   **`-ports 443,80,8080,8000,888`**: Scans for common web ports.
-   **`-threads 200`**: Sets the number of concurrent threads for faster scanning.
-   **`> alive.txt`**: Saves the list of live domains to `alive.txt`.

## 2. Open Ports Scan

Once you have a list of live domains, the next step is to scan for open ports. This helps in identifying running services that could be potential entry points.

```bash
nabbu -list domain.txt -c 50 -nmap-cli 'nmap -sV -sC' -o nabbufull.txt
```

-   **`nabbu`**: A fast port scanner.
-   **`-list domain.txt`**: Specifies the input list of domains.
-   **`-c 50`**: Sets the concurrency level.
-   **`-nmap-cli 'nmap -sV -sC'`**: Runs an Nmap scan with service version detection (`-sV`) and default scripts (`-sC`) on the discovered open ports.
-   **`-o nabbufull.txt`**: Saves the full Nmap scan output to `nabbufull.txt`.

## 3. Directory Search

Discovering hidden directories and files is crucial for finding sensitive information and potential vulnerabilities.

```bash
dirsearch -l alive.txt -x 500,200,502,429,404,400 -R 5 --random-agent -t 100 -F -o directory.txt -w (wordlist)
```

-   **`dirsearch`**: A popular tool for directory and file brute-forcing.
-   **`-l alive.txt`**: Uses the list of live domains.
-   **`-x 500,200,502,429,404,400`**: Excludes specific HTTP status codes from the results.
-   **`-R 5`**: Follows redirects up to 5 times.
-   **`--random-agent`**: Uses random User-Agents for requests.
-   **`-t 100`**: Sets the number of threads.
-   **`-F`**: Forces extensions for every word in the wordlist.
-   **`-o directory.txt`**: Saves the output to `directory.txt`.
-   **`-w (wordlist)`**: Specifies the path to your wordlist.

## 4. Parameter Discovery

Finding URL parameters is essential for identifying potential vulnerabilities like SQL injection, XSS, and more.

```bash
cat alive.txt | gau > param.txt
```

-   **`gau` (getallurls)**: A tool to fetch known URLs from AlienVault's Open Threat Exchange, the Wayback Machine, and Common Crawl.
-   **`> param.txt`**: Saves all discovered URLs with parameters to `param.txt`.

## 5. Parameter Filtering

After discovering parameters, it's useful to filter them to identify unique and potentially interesting ones.

```bash
cat param.txt | uro -o filterparam.txt
```

-   **`uro`**: A tool to de-duplicate and filter URLs.
-   **`-o filterparam.txt`**: Saves the filtered, unique URLs to `filterparam.txt`.

## 6. JS File Enumeration

JavaScript files often contain sensitive information, API endpoints, and logic that can be exploited.

```bash
cat filterparam.txt | grep ".js$" > jsfiles.txt
```

-   **`grep ".js$"`**: Filters the list of URLs to find those ending with `.js`.
-   **`> jsfiles.txt`**: Saves the list of JavaScript files to `jsfiles.txt`.

## 7. JS File Analysis

Further analyze the discovered JavaScript files to find more endpoints and secrets.

```bash
cat jsfiles.txt | uro | anew jsfiles.txt
```

-   This command chain helps in de-duplicating and updating the list of unique JS files.

## 8. Automated Vulnerability Scanning (Nuclei)

Nuclei is a powerful tool for sending requests across targets based on templates, allowing for fast and automated vulnerability scanning.

### Basic Scan

```bash
/root/go/bin/nuclei -l jsfiles.txt -t (templates) -es info -c 70 -rl 200 -fhr -lfa
```

### Targeted Scan for Common Vulnerabilities

```bash
/root/go/bin/nuclei -l jsfiles.txt -tags lfi,rce,sqli
```

-   **`/root/go/bin/nuclei`**: Path to the Nuclei binary.
-   **`-l jsfiles.txt`**: Uses the list of JS files as targets.
-   **`-t (templates)`**: Specifies the path to your Nuclei templates.
-   **`-es info`**: Excludes templates with an "info" severity.
-   **`-c 70`**: Sets the concurrency level.
-   **`-rl 200`**: Sets the rate limit to 200 requests per second.
-   **`-fhr`**: Shows the full HTTP request/response in the output.
-   **`-lfa`**: Lists all found assets.
-   **`-tags lfi,rce,sqli`**: Runs templates with specific tags like Local File Inclusion (LFI), Remote Code Execution (RCE), and SQL Injection (SQLi).

## 9. Secret Finding

Scan JavaScript files for hardcoded secrets like API keys, tokens, and credentials.

```bash
cat jsfiles.txt | while read url; do python3 /secretfinder.py -i $url -o cli >> secret.txt; done
```

-   **`while read url; do ... done`**: Loops through each URL in `jsfiles.txt`.
-   **`python3 /secretfinder.py`**: Runs the SecretFinder script.
-   **`-i $url`**: Specifies the input URL.
-   **`-o cli`**: Outputs the results to the command line.
-   **`>> secret.txt`**: Appends the found secrets to `secret.txt`.

## Contributing & Submitting Reviews

We welcome contributions! If you have suggestions for improving this methodology or want to add new techniques, you can submit them through the form on our community website.

### How It Works

This project uses a unique, automated system for handling reviews, powered by GitHub Actions:

<div align="center">
  <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTFpamVnNmsya2Y1ZHh1bGUzbWNoNzB0Z2oxcGxjanMwa2Q4Z2hxZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QtjhwhUYHOefY9ePkK/giphy.gif" alt="Review Submission Workflow GIF" width="600">
</div>

1.  **Submit a Review**: When you submit a review on the website, it will open a new issue in this GitHub repository with your review pre-filled.
2.  **Create the Issue**: Simply click "Submit new issue" to add your review.
3.  **Automated Update**: A GitHub Action will automatically detect the new issue, add your review to the `reviews.json` file, and commit the change to the repository.
4.  **See it Live**: Your review will then appear on the website for everyone to see.

If you'd like to contribute in other ways, please feel free to open an issue or submit a pull request.

## Disclaimer

This methodology is for educational purposes only. Always ensure you have explicit permission to test any target. Unauthorized scanning and testing can have legal consequences.
