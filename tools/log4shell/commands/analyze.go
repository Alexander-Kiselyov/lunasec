// Copyright 2021 by LunaSec (owned by Refinery Labs, Inc)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
package commands

import (
	"github.com/lunasec-io/lunasec/tools/log4shell/analyze"
	"github.com/lunasec-io/lunasec/tools/log4shell/findings"
	"github.com/lunasec-io/lunasec/tools/log4shell/scan"
	"github.com/urfave/cli/v2"
)

func AnalyzeCommand(c *cli.Context) error {
	enableGlobalFlags(c)

	searchDirs := c.Args().Slice()

	processArchiveFile := analyze.ProcessArchiveFile

	scanner := scan.NewLog4jDirectoryScanner([]string{}, false, processArchiveFile)

	scannerFindings := scanner.Scan(searchDirs)

	output := c.String("output")
	if output != "" {
		return findings.SerializeToFile(output, scannerFindings)
	}
	return nil
}
