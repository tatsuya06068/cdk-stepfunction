package main

import (
	"context"
	"fmt"
	"github.com/aws/aws-lambda-go/lambda"
	cloudtasks "cloud.google.com/go/cloudtasks/apiv2"
	taskspb "google.golang.org/genproto/googleapis/cloud/tasks/v2"
)

type MyEvent struct {
	DirectryPath string `json:"name"`
	TableName string `json:"name"`
}

func HandleRequest(ctx context.Context, event *MyEvent) (*string, error) {
	if event == nil {
		return nil, fmt.Errorf("received nil event")
	}

	dir := fmt.Sprintf("DirectryPath %s!", event.DirectryPath)
	table := fmt.Sprintf("TableName %s!", event.TableName)


	client, err := cloudtasks.NewClient(ctx)

	if err != nil {
		log.Fatal(err.Error())
	}
	defer client.Close()

	queuePath := "project" // path

	req := &taskspb.CreateTaskRequest{
		Parent: queuePath,
		Task: &taskspb.Task{
			MessageType: &taskspb.Task_HttpRequest{
				HttpRequest: &taskspb.HttpRequest{
					HttpMethod: taskspb.HttpMethod_POST,
					Url:        "https://httpbin.org/status/500",
				},
			},
		},
	}
	req.Task.GetHttpRequest().Body = []byte("test")

	_, err = client.CreateTask(ctx, req)
	if err != nil {
		log.Fatal(err.Error())
	}



	return &table, nil
}

func main() {
	lambda.Start(HandleRequest)
}